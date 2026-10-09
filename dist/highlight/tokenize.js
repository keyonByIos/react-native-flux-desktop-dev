"use strict";
// 轻量语法分词器：按行产出「文本片段 + 类型」，供 CodeBlock 上色。零第三方依赖（不引 Prism/Shiki）。
// 支持 js/ts/jsx/tsx、json、python、bash/sh、css、go、rust、java/kotlin/c#、c、c++、php、ruby、sql、yaml、html/xml；跨行块注释 /* */ 与 <!-- --> 由外部传入 state 续扫。
// 类型：comment / string / number / keyword / boolean / func（标识符后紧跟左括号）/ punct / ident / plain；JSX 专有：jsxTag（标签名）/ jsxAttr（属性名）。
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenizeLine = tokenizeLine;
exports.tokenize = tokenize;
const KW = {
    js: 'const let var function return if else for while class extends new import export from default async await try catch finally throw typeof instanceof this super interface type enum implements public private protected readonly static get set of in yield switch case do break continue delete void as satisfies keyof infer declare namespace abstract'.split(' '),
    py: 'def class return if elif else for while import from as try except finally with lambda and or not in is pass break continue global nonlocal yield raise async await assert del'.split(' '),
    sh: 'if then else elif fi for while until do done case esac function in select time echo export local readonly source return break continue exit set shift'.split(' '),
    css: 'important media supports keyframes import charset font-face root'.split(' '),
    go: 'package import func return if else for range struct interface map chan go defer type const var switch case default make new fallthrough goto break continue string int int64 float64 bool byte rune error nil'.split(' '),
    rust: 'fn let mut const static struct enum impl trait pub use mod crate self super where match if else for while loop return type as dyn ref move async await unsafe extern break continue'.split(' '),
    java: 'public private protected class interface extends implements new return if else for while do switch case default try catch finally throw throws package import static final abstract synchronized void int long double float boolean char byte this super instanceof var record sealed'.split(' '),
    c: 'int char float double void long short unsigned signed struct union enum typedef static const extern return if else for while do switch case break continue goto sizeof register volatile'.split(' '),
    cpp: 'int char float double void long short unsigned signed struct union enum typedef static const extern return if else for while do switch case break continue class public private protected virtual template namespace using new delete nullptr this operator friend constexpr override'.split(' '),
    php: 'function return if else elseif for foreach while do switch case default class interface extends implements public private protected static new echo print require include require_once namespace use trait abstract final try catch finally throw as instanceof global unset isset array'.split(' '),
    ruby: 'def end class module if elsif else unless while until for in do return yield begin rescue ensure then case when require require_relative attr_accessor attr_reader attr_writer self nil and not or puts print lambda proc'.split(' '),
    sql: 'select from where insert into values update set delete create alter drop table index view join left right inner outer full cross on group by order having as and or not null distinct limit offset union primary key foreign references default count sum avg max min case when then else end exists between in like desc asc'.split(' '),
    yaml: 'true false null on off yes no'.split(' '),
};
const BOOLS = new Set(['true', 'false', 'null', 'undefined', 'None', 'NaN', 'Infinity']);
/** 语言别名归一到内部族键 */
function normLang(lang) {
    const l = lang.toLowerCase();
    switch (l) {
        case 'ts':
        case 'tsx':
        case 'typescript':
        case 'js':
        case 'jsx':
        case 'javascript': return 'js';
        case 'py':
        case 'python':
        case 'py3': return 'py';
        case 'sh':
        case 'bash':
        case 'shell':
        case 'zsh': return 'sh';
        case 'css':
        case 'scss':
        case 'less': return 'css';
        case 'json':
        case 'json5': return 'json';
        case 'go':
        case 'golang': return 'go';
        case 'rs':
        case 'rust': return 'rust';
        case 'java':
        case 'kotlin':
        case 'kt':
        case 'scala':
        case 'csharp':
        case 'cs': return 'java';
        case 'c':
        case 'h': return 'c';
        case 'cpp':
        case 'cc':
        case 'cxx':
        case 'hpp':
        case 'c++': return 'cpp';
        case 'php': return 'php';
        case 'rb':
        case 'ruby': return 'ruby';
        case 'sql':
        case 'mysql':
        case 'postgres':
        case 'plsql': return 'sql';
        case 'yaml':
        case 'yml': return 'yaml';
        case 'html':
        case 'htm':
        case 'xml':
        case 'svg':
        case 'vue': return 'html';
        default: return 'js';
    }
}
function kwSet(lang) {
    const nl = normLang(lang);
    if (nl === 'json' || nl === 'html')
        return new Set();
    return new Set(KW[nl] ?? KW.js);
}
/** 行注释前缀（依语言族） */
function linePrefix(lang) {
    const nl = normLang(lang);
    if (nl === 'py' || nl === 'sh' || nl === 'yaml' || nl === 'ruby')
        return '#';
    if (nl === 'sql')
        return '--';
    if (nl === 'json')
        return null;
    return '//';
}
const isIdentStart = (c) => /[A-Za-z_$]/.test(c);
const isIdent = (c) => /[A-Za-z0-9_$]/.test(c);
const isDigit = (c) => c >= '0' && c <= '9';
/** 分词一行；state 会被就地更新（块注释跨行）。 */
function tokenizeLine(line, lang, state) {
    if (normLang(lang) === 'html')
        return tokenizeHtmlLine(line, state);
    const kws = kwSet(lang);
    const nl = normLang(lang);
    const lp = linePrefix(lang);
    const toks = [];
    const push = (t, k) => {
        if (!t)
            return;
        const last = toks[toks.length - 1];
        if (last && last.k === k)
            last.t += t;
        else
            toks.push({ t, k });
    };
    let i = 0;
    // JSX（js/tsx）上下文栈：'tag' 帧收集标签名/属性，'expr' 帧处理 {} 表达式；跨行保留以支持多行标签与嵌套 JSX
    const stack = nl === 'js' && Array.isArray(state.jsxStack) ? state.jsxStack : [];
    const top = () => stack[stack.length - 1];
    const saveJsx = () => {
        if (nl === 'js')
            state.jsxStack = stack;
    };
    // 续接上一行的块注释
    if (state.inBlock) {
        const end = line.indexOf('*/');
        if (end < 0) {
            push(line, 'comment');
            return toks;
        }
        push(line.slice(0, end + 2), 'comment');
        i = end + 2;
        state.inBlock = false;
    }
    while (i < line.length) {
        const c = line[i];
        const c2 = line[i + 1];
        // 块注释
        if (c === '/' && c2 === '*') {
            const end = line.indexOf('*/', i + 2);
            if (end < 0) {
                push(line.slice(i), 'comment');
                state.inBlock = true;
                return toks;
            }
            push(line.slice(i, end + 2), 'comment');
            i = end + 2;
            continue;
        }
        // 行注释：// / # / --（依语言）
        if (lp === '//' && c === '/' && c2 === '/') {
            push(line.slice(i), 'comment');
            return toks;
        }
        if (lp === '#' && c === '#') {
            push(line.slice(i), 'comment');
            return toks;
        }
        if (lp === '--' && c === '-' && c2 === '-') {
            push(line.slice(i), 'comment');
            return toks;
        }
        // 字符串
        if (c === '"' || c === "'" || c === '`') {
            let j = i + 1;
            while (j < line.length) {
                if (line[j] === '\\') {
                    j += 2;
                    continue;
                }
                if (line[j] === c) {
                    j++;
                    break;
                }
                j++;
            }
            push(line.slice(i, j), 'string');
            i = j;
            continue;
        }
        // 数字
        if (isDigit(c) || (c === '.' && isDigit(c2))) {
            let j = i;
            while (j < line.length && /[0-9._a-fA-FxX]/.test(line[j]))
                j++;
            push(line.slice(i, j), 'number');
            i = j;
            continue;
        }
        // JSX 开始/结束标签：'<' 紧跟标识符起始（或 '</' + 标识符）；栈顶不是 tag 帧时才能开新标签（允许 {} 内嵌套 JSX）
        if (c === '<' && top()?.kind !== 'tag') {
            const before = i === 0 ? '' : line[i - 1];
            const beforeOk = before === '' || /[\s({[,;>=]/.test(before);
            const isClose = c2 === '/';
            const nameCh = isClose ? line[i + 2] : c2;
            // 结束标签 '</X' 在 JS 中无歧义，无需 beforeOk；开始标签 '<X' 才需前置边界以排除泛型/比较
            if (nameCh && isIdentStart(nameCh) && (isClose || beforeOk)) {
                push('<', 'punct');
                i++;
                if (isClose) {
                    push('/', 'punct');
                    i++;
                }
                stack.push({ kind: 'tag', expectName: true });
                continue;
            }
        }
        // JSX 表达式：'{' 在 tag 帧下压入 expr 帧（挂起标签），在 expr 帧内则计嵌套层数
        if (c === '{') {
            const f = top();
            if (f && f.kind === 'expr')
                f.braces = (f.braces ?? 0) + 1;
            else
                stack.push({ kind: 'expr', braces: 0 });
            push('{', 'punct');
            i++;
            continue;
        }
        if (c === '}') {
            const f = top();
            if (f && f.kind === 'expr') {
                if ((f.braces ?? 0) > 0)
                    f.braces = (f.braces ?? 0) - 1;
                else
                    stack.pop();
            }
            push('}', 'punct');
            i++;
            continue;
        }
        if (c === '>' && top()?.kind === 'tag') {
            stack.pop();
            push('>', 'punct');
            i++;
            continue;
        }
        // 标识符 / 关键字
        if (isIdentStart(c)) {
            let j = i;
            while (j < line.length && isIdent(line[j]))
                j++;
            const word = line.slice(i, j);
            // 跳过其后空白看是否 '(' → 函数名
            let k = j;
            while (k < line.length && line[k] === ' ')
                k++;
            const f = top();
            let kind = 'ident';
            if (f && f.kind === 'tag') {
                if (f.expectName) {
                    kind = 'jsxTag';
                    f.expectName = false;
                }
                else
                    kind = 'jsxAttr';
            }
            else if (BOOLS.has(word))
                kind = 'boolean';
            else if (kws.has(word) || (nl === 'sql' && kws.has(word.toLowerCase())))
                kind = 'keyword';
            else if (line[k] === '(')
                kind = 'func';
            else if (nl === 'json' && line[k] === ':')
                kind = 'keyword'; // JSON 键
            push(word, kind);
            i = j;
            continue;
        }
        // 标点
        if (/[{}()[\].,;:+\-*/%=<>!&|^~?]/.test(c)) {
            push(c, 'punct');
            i++;
            continue;
        }
        // 其它（空白等）
        push(c, 'plain');
        i++;
    }
    saveJsx();
    return toks;
}
/** HTML/XML 行分词：标签名=keyword、属性名=func、字符串照旧；支持跨行 <!-- --> 注释。 */
function tokenizeHtmlLine(line, state) {
    const toks = [];
    const push = (t, k) => {
        if (!t)
            return;
        const last = toks[toks.length - 1];
        if (last && last.k === k)
            last.t += t;
        else
            toks.push({ t, k });
    };
    let i = 0;
    // 续接上一行未闭合的 <!-- 注释
    if (state.inBlock) {
        const end = line.indexOf('-->');
        if (end < 0) {
            push(line, 'comment');
            return toks;
        }
        push(line.slice(0, end + 3), 'comment');
        i = end + 3;
        state.inBlock = false;
    }
    let inTag = false;
    let tagNamed = false; // 当前标签是否已吃掉标签名
    while (i < line.length) {
        if (!inTag) {
            // <!-- 注释 -->
            if (line.startsWith('<!--', i)) {
                const end = line.indexOf('-->', i + 4);
                if (end < 0) {
                    push(line.slice(i), 'comment');
                    state.inBlock = true;
                    return toks;
                }
                push(line.slice(i, end + 3), 'comment');
                i = end + 3;
                continue;
            }
            if (line[i] === '<') {
                push('<', 'punct');
                i++;
                if (line[i] === '/') {
                    push('/', 'punct');
                    i++;
                }
                inTag = true;
                tagNamed = false;
                continue;
            }
            // 普通文本直到下一个 <
            const next = line.indexOf('<', i);
            const end = next < 0 ? line.length : next;
            push(line.slice(i, end), 'plain');
            i = end;
            continue;
        }
        // 标签内
        const c = line[i];
        if (c === '>') {
            push('>', 'punct');
            inTag = false;
            i++;
            continue;
        }
        if (c === '"' || c === "'") {
            let j = i + 1;
            while (j < line.length && line[j] !== c)
                j++;
            if (j < line.length)
                j++;
            push(line.slice(i, j), 'string');
            i = j;
            continue;
        }
        if (/[/=<_!]/.test(c)) {
            push(c, 'punct');
            i++;
            continue;
        }
        if (/\s/.test(c)) {
            push(c, 'plain');
            i++;
            continue;
        }
        if (/[A-Za-z0-9_@$:.-]/.test(c)) {
            let j = i;
            while (j < line.length && /[A-Za-z0-9_@$:.\-]/.test(line[j]))
                j++;
            const word = line.slice(i, j);
            let kind;
            if (!tagNamed) {
                kind = 'keyword'; // 标签名
                tagNamed = true;
            }
            else {
                let k2 = j;
                while (k2 < line.length && /\s/.test(line[k2]))
                    k2++;
                kind = line[k2] === '=' ? 'func' : 'ident'; // 属性名 vs 裸值
            }
            push(word, kind);
            i = j;
            continue;
        }
        push(c, 'plain');
        i++;
    }
    return toks;
}
/** 分词整段代码，返回每行的 token 数组。 */
function tokenize(code, lang = 'js') {
    const state = { inBlock: false };
    return code.replace(/\r\n?/g, '\n').split('\n').map((ln) => tokenizeLine(ln, lang, state));
}
exports.default = tokenize;
