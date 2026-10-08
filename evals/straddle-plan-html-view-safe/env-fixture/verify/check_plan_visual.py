"""Fixture-owned shape check for straddle-plan-visual.html (ME-929), run by the env-fixture Stop hook.

It reads the workspace's straddle-plan-visual.html as data, never runs it, and writes .plan-visual-shape.txt: one
`PASS ...` line, or `FAIL` and one line per problem. It fails the four things show-me.md and straddle-design.md rule
out for this view:

- a flow step over 25 words (show-me.md: "about 25 words or fewer");
- code in the flow: a code, pre, kbd, samp, tt or var element, a backtick, a route, a call, a camelCase name or an
  `<id>` placeholder;
- flow steps whose desktop widths can depend on their content: anything but equal grid tracks that can't grow with
  content (`minmax(0, 1fr)`, a fixed length, or `1fr` with `min-width: 0` on the steps) or equal flex items with a
  zero basis and `min-width: 0`, a rule that sizes only some steps, or a flow that doesn't sit in one row;
- an accent: a color with a visible hue (OKLCH chroma over 0.04) that isn't one of straddle-design.md's light-mode
  tokens. Neutrals and faint washes aren't accents.

The flow is the first `ol` whose class or id names a flow or steps, else the first element whose class or id does,
else the first `ol`. Desktop means a 1440px viewport in light mode.

Usage: check_plan_visual.py WORKSPACE   writes WORKSPACE/.plan-visual-shape.txt
       check_plan_visual.py --print FILE prints the result for FILE
"""
import math
import os
import re
import secrets
import sys
from html.parser import HTMLParser

VIEW = "straddle-plan-visual.html"
RESULT = ".plan-visual-shape.txt"
MAX_BYTES = 1 << 20
MAX_WORDS = 25
DESKTOP_PX = 1440
ACCENT_CHROMA = 0.04

# straddle-design.md light-mode tokens (vendored 2026-10-01 from straddleio/design 6788103).
TOKEN_HEX = {"f2f2f2", "fdfdfd", "fefdfb", "fffffd", "eeede9", "dfdeda", "282828", "555555", "23211e", "00684a",
             "f8f5ee", "00ed64", "f4f3f1", "eef8f3"}
TOKEN_OKLCH = [(0.986, 0.0024, 92), (0.32, 0.06, 165), (0.5, 0.1, 165), (0.27, 0, 0), (0.54, 0.14, 150),
               (0.74, 0.15, 78), (0.52, 0.104, 235), (0.54, 0.22, 27), (0.21, 0.012, 265)]
NAMED = dict(item.split(":") for item in """aliceblue:f0f8ff antiquewhite:faebd7 aqua:00ffff aquamarine:7fffd4
azure:f0ffff beige:f5f5dc bisque:ffe4c4 black:000000 blanchedalmond:ffebcd blue:0000ff blueviolet:8a2be2 brown:a52a2a
burlywood:deb887 cadetblue:5f9ea0 chartreuse:7fff00 chocolate:d2691e coral:ff7f50 cornflowerblue:6495ed
cornsilk:fff8dc crimson:dc143c cyan:00ffff darkblue:00008b darkcyan:008b8b darkgoldenrod:b8860b darkgray:a9a9a9
darkgreen:006400 darkgrey:a9a9a9 darkkhaki:bdb76b darkmagenta:8b008b darkolivegreen:556b2f darkorange:ff8c00
darkorchid:9932cc darkred:8b0000 darksalmon:e9967a darkseagreen:8fbc8f darkslateblue:483d8b darkslategray:2f4f4f
darkslategrey:2f4f4f darkturquoise:00ced1 darkviolet:9400d3 deeppink:ff1493 deepskyblue:00bfff dimgray:696969
dimgrey:696969 dodgerblue:1e90ff firebrick:b22222 floralwhite:fffaf0 forestgreen:228b22 fuchsia:ff00ff
gainsboro:dcdcdc ghostwhite:f8f8ff gold:ffd700 goldenrod:daa520 gray:808080 green:008000 greenyellow:adff2f
grey:808080 honeydew:f0fff0 hotpink:ff69b4 indianred:cd5c5c indigo:4b0082 ivory:fffff0 khaki:f0e68c lavender:e6e6fa
lavenderblush:fff0f5 lawngreen:7cfc00 lemonchiffon:fffacd lightblue:add8e6 lightcoral:f08080 lightcyan:e0ffff
lightgoldenrodyellow:fafad2 lightgray:d3d3d3 lightgreen:90ee90 lightgrey:d3d3d3 lightpink:ffb6c1 lightsalmon:ffa07a
lightseagreen:20b2aa lightskyblue:87cefa lightslategray:778899 lightslategrey:778899 lightsteelblue:b0c4de
lightyellow:ffffe0 lime:00ff00 limegreen:32cd32 linen:faf0e6 magenta:ff00ff maroon:800000 mediumaquamarine:66cdaa
mediumblue:0000cd mediumorchid:ba55d3 mediumpurple:9370db mediumseagreen:3cb371 mediumslateblue:7b68ee
mediumspringgreen:00fa9a mediumturquoise:48d1cc mediumvioletred:c71585 midnightblue:191970 mintcream:f5fffa
mistyrose:ffe4e1 moccasin:ffe4b5 navajowhite:ffdead navy:000080 oldlace:fdf5e6 olive:808000 olivedrab:6b8e23
orange:ffa500 orangered:ff4500 orchid:da70d6 palegoldenrod:eee8aa palegreen:98fb98 paleturquoise:afeeee
palevioletred:db7093 papayawhip:ffefd5 peachpuff:ffdab9 peru:cd853f pink:ffc0cb plum:dda0dd powderblue:b0e0e6
purple:800080 rebeccapurple:663399 red:ff0000 rosybrown:bc8f8f royalblue:4169e1 saddlebrown:8b4513 salmon:fa8072
sandybrown:f4a460 seagreen:2e8b57 seashell:fff5ee sienna:a0522d silver:c0c0c0 skyblue:87ceeb slateblue:6a5acd
slategray:708090 slategrey:708090 snow:fffafa springgreen:00ff7f steelblue:4682b4 tan:d2b48c teal:008080
thistle:d8bfd8 tomato:ff6347 turquoise:40e0d0 violet:ee82ee wheat:f5deb3 white:ffffff whitesmoke:f5f5f5
yellow:ffff00 yellowgreen:9acd32""".split())

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
CODE_TAGS = {"code", "pre", "kbd", "samp", "tt", "var"}
CODE_TEXT = [("a backtick", re.compile(r"`")),
             ("a route", re.compile(r"(?<![\w.])/(?:api|v\d+|webhooks?)\b|\b(?:GET|POST|PUT|PATCH|DELETE) /")),
             ("a call", re.compile(r"\b[A-Za-z_][\w.]*\(")),
             ("a camelCase name", re.compile(r"\b[a-z]+[A-Z][A-Za-z0-9]*\b")),
             ("an ID placeholder", re.compile(r"<[A-Za-z_][\w-]*>"))]
SIZING = {"width", "min-width", "max-width", "inline-size", "min-inline-size", "max-inline-size", "flex",
          "flex-grow", "flex-shrink", "flex-basis", "grid-column", "grid-column-start", "grid-column-end", "grid-area"}
STRUCTURAL = re.compile(r":(?:nth-|first-|last-|only-|not\()")
NO_COLOR_PROPS = re.compile(r"^(?:font|font-family|content|grid-template-areas|transition.*|animation.*|will-change|"
                            r"counter-.*|quotes)$")


class Node:
    def __init__(self, tag, attrs, parent):
        self.tag, self.attrs, self.parent, self.children = tag, attrs, parent, []

    def elements(self):
        for child in self.children:
            if isinstance(child, Node):
                yield child
                yield from child.elements()

    def text(self):
        if self.tag in ("style", "script"):
            return ""
        return " ".join(c if isinstance(c, str) else c.text() for c in self.children)

    def tokens(self):
        return set((self.attrs.get("class") or "").split()) | {self.attrs.get("id") or ""}


class Builder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = self.current = Node("#document", {}, None)

    def handle_starttag(self, tag, attrs):
        if tag in ("li", "p") and self.current.tag == tag:
            self.current = self.current.parent
        node = Node(tag, {k: v or "" for k, v in attrs}, self.current)
        self.current.children.append(node)
        if tag not in VOID:
            self.current = node

    def handle_startendtag(self, tag, attrs):
        self.current.children.append(Node(tag, {k: v or "" for k, v in attrs}, self.current))

    def handle_endtag(self, tag):
        node = self.current
        while node is not self.root and node.tag != tag:
            node = node.parent
        if node is not self.root:
            self.current = node.parent

    def handle_data(self, data):
        self.current.children.append(data)


def css_rules(css, media=None, out=None):
    """Every style rule as (selectors, declarations, media), in source order. Skips @font-face, @keyframes and the like."""
    out = [] if out is None else out
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    i = 0
    while i < len(css):
        brace = css.find("{", i)
        semi = css.find(";", i)
        if brace < 0:
            break
        if 0 <= semi < brace and css[i:semi].strip().startswith("@"):
            i = semi + 1
            continue
        prelude, depth, j = css[i:brace].strip(), 1, brace + 1
        while j < len(css) and depth:
            depth += {"{": 1, "}": -1}.get(css[j], 0)
            j += 1
        body = css[brace + 1:j - 1]
        if prelude.startswith("@media"):
            css_rules(body, (media + " and " if media else "") + prelude[6:], out)
        elif prelude.startswith(("@supports", "@layer", "@container")):
            css_rules(body, media, out)
        elif not prelude.startswith("@"):
            out.append((prelude, declarations(body), media))
        i = j
    return out


def declarations(body):
    found = []
    for part in body.split(";"):
        prop, colon, value = part.partition(":")
        if colon and prop.strip():
            found.append((prop.strip().lower(), re.sub(r"\s*!important\s*$", "", value.strip())))
    return found


def desktop(media):
    if not media:
        return True
    m = media.lower()
    if re.search(r"\bprint\b", m) and not re.search(r"\b(?:screen|all)\b", m):
        return False
    if re.search(r"prefers-color-scheme\s*:\s*dark", m):
        return False
    px = lambda number, unit: float(number) * (1 if unit == "px" else 16)
    for kind, number, unit in re.findall(r"(min|max)-width\s*:\s*([\d.]+)(px|r?em)", m):
        if (kind == "min" and px(number, unit) > DESKTOP_PX) or (kind == "max" and px(number, unit) < DESKTOP_PX):
            return False
    for op, number, unit in re.findall(r"width\s*([<>]=?)\s*([\d.]+)(px|r?em)", m):
        if (op[0] == ">" and DESKTOP_PX <= px(number, unit)) or (op[0] == "<" and DESKTOP_PX >= px(number, unit)):
            return False
    return True


def compounds(selector):
    """The selector's compounds from right to left, and whether a sibling combinator makes it match only some."""
    parts = re.split(r"\s*([>+~])\s*|\s+", selector.strip())
    names = [p for p in parts if p and p not in ">+~"]
    return names[::-1], any(p in ("+", "~") for p in parts if p)


def compound_matches(compound, node):
    bare = re.sub(r"::?[\w-]+(?:\([^)]*\))?", "", compound)
    tag = re.match(r"[a-zA-Z][\w-]*|\*", bare)
    if tag and tag.group() != "*" and tag.group().lower() != node.tag:
        return False
    if ":root" in compound and node.tag != "html":
        return False
    if any(c not in node.tokens() for c in re.findall(r"\.([\w-]+)", bare)):
        return False
    if any(i != node.attrs.get("id") for i in re.findall(r"#([\w-]+)", bare)):
        return False
    return all(a in node.attrs for a in re.findall(r"\[\s*([\w-]+)", bare))


def selector_matches(selector, node):
    """(matches, subset): subset when the selector reaches only some of the elements like node."""
    chain, sibling = compounds(selector)
    if not chain or re.search(r"::|:(?:before|after)\b|:(?:hover|focus|active|visited|focus-\w+)\b", chain[0]):
        return False, False
    if not compound_matches(chain[0], node):
        return False, False
    ancestor = node.parent
    for compound in chain[1:]:
        while ancestor is not None and not compound_matches(compound, ancestor):
            ancestor = ancestor.parent
        if ancestor is None:
            return False, False
        ancestor = ancestor.parent
    return True, sibling or bool(STRUCTURAL.search(chain[0]))


def specificity(selector):
    bare = re.sub(r"::[\w-]+", "", selector)
    return (len(re.findall(r"#[\w-]", bare)), len(re.findall(r"\.[\w-]|\[|:(?!:)", bare)),
            len(re.findall(r"(?:^|[\s>+~])[a-zA-Z]", bare)))


class Styles:
    def __init__(self, rules):
        self.rules = [rule for rule in rules if desktop(rule[2])]

    def effective(self, node):
        """Desktop declarations for node, cascaded by specificity then source order, inline style last."""
        applied, subset = [], []
        for order, (selectors, decls, _) in enumerate(self.rules):
            for selector in selectors.split(","):
                matched, partial = selector_matches(selector, node)
                if matched and partial:
                    subset += [(selector.strip(), p) for p, _ in decls if p in SIZING]
                elif matched:
                    applied += [((specificity(selector), order), p, v) for p, v in decls]
        result = {p: v for _, p, v in sorted(applied, key=lambda item: item[0])}
        result.update(declarations(node.attrs.get("style", "")))
        return {p: v.strip().lower() for p, v in result.items()}, subset


def tracks(value):
    """Grid tracks with repeat() expanded, and the column count (None for auto-fit or auto-fill)."""
    count, out = 0, []
    track = r"minmax\([^()]*\)|fit-content\([^()]*\)|[^\s()]+"
    for match in re.finditer(r"repeat\(\s*(\d+|auto-fit|auto-fill)\s*,\s*((?:[^()]|\([^()]*\))+)\)|" + track, value):
        if not match.group(1):
            out.append(match.group())
            count = None if count is None else count + 1
            continue
        inner = re.findall(track, match.group(2))
        times = int(match.group(1)) if match.group(1).isdigit() else 1
        out += inner * times
        count = None if count is None or not match.group(1).isdigit() else count + len(inner) * times
    return [re.sub(r"\s+", " ", t) for t in out], count


def can_shrink(style):
    return (style.get("min-width") in ("0", "0px") or style.get("min-inline-size") in ("0", "0px")
            or style.get("overflow", "visible") not in ("visible", "") or style.get("overflow-x", "visible") not in ("visible", ""))


def flex_parts(style):
    grow, shrink, basis = "0", "1", "auto"
    flex = style.get("flex", "")
    words = flex.split()
    if flex in ("auto",):
        grow, basis = "1", "auto"
    elif flex == "none":
        grow, shrink = "0", "0"
    elif words and re.fullmatch(r"[\d.]+", words[0]):
        grow, basis = words[0], "0"
        if len(words) > 1:
            if re.fullmatch(r"[\d.]+", words[1]):
                shrink = words[1]
                basis = words[2] if len(words) > 2 else "0"
            else:
                basis = words[1]
    grow = style.get("flex-grow", grow)
    basis = style.get("flex-basis", basis)
    if basis == "auto" and style.get("width"):
        basis = style["width"]
    return float(grow), re.sub(r"^0(?:px|%)?$", "0", basis)


def width_problems(flow, steps, styles):
    container, _ = styles.effective(flow)
    step_styles, problems = [], []
    for step in steps:
        style, subset = styles.effective(step)
        step_styles.append(style)
        problems += [f"`{selector}` sets {prop} on only some flow steps, so their widths differ" for selector, prop in subset]
    inline = {tuple(sorted((p, v) for p, v in declarations(s.attrs.get("style", "")) if p in SIZING)) for s in steps}
    if len(inline) > 1:
        problems.append("flow steps carry different inline sizes")
    shrink = all(can_shrink(style) for style in step_styles)
    display = container.get("display", "block")
    if "grid" in display:
        columns = container.get("grid-template-columns", "none")
        if columns in ("none", ""):
            if "column" not in container.get("grid-auto-flow", ""):
                return problems + ["the flow is a one-column grid, so its steps stack instead of sitting in one row"]
            columns, count = container.get("grid-auto-columns", "auto"), None
            found = [columns]
        else:
            found, count = tracks(columns)
        if len(set(found)) > 1:
            return problems + [f"the flow's grid columns differ ({columns})"]
        track = found[0] if found else "auto"
        if count is not None and count < len(steps):
            problems.append(f"{count} grid columns for {len(steps)} steps, so the flow wraps instead of one row")
        if re.fullmatch(r"minmax\(\s*0(?:px|%)?\s*,\s*[\d.]*fr\s*\)", track) or re.fullmatch(r"[\d.]+(?:px|r?em|%)", track):
            return problems
        if re.fullmatch(r"[\d.]*fr", track):
            return problems + ([] if shrink else [f"`{track}` columns with no `min-width: 0` on the steps grow to fit their content"])
        return problems + [f"grid track `{track}` sizes the steps to their content"]
    if "flex" in display:
        if container.get("flex-direction", "row").startswith("column"):
            return problems + ["the flow is a column, so its steps stack instead of sitting in one row"]
        parts = {flex_parts(style) for style in step_styles}
        if len(parts) > 1:
            return problems + ["flow steps have different flex sizes"]
        grow, basis = parts.pop()
        if grow > 0 and basis == "0":
            return problems + ([] if shrink else ["flex steps with no `min-width: 0` grow to fit their content"])
        if re.fullmatch(r"[\d.]+(?:px|r?em|%)|calc\([^;]*\)", basis):
            return problems
        return problems + [f"flex steps sized `{basis}` follow their content"]
    return problems + [f"the flow is `display: {display}`, so its steps don't sit in one row of equal columns"]


def word_and_code_problems(flow, steps):
    problems = []
    for number, step in enumerate(steps, 1):
        words = [w for w in step.text().split() if re.search(r"[A-Za-z0-9]", w)]
        if len(words) > MAX_WORDS:
            problems.append(f"flow step {number} has {len(words)} words (limit {MAX_WORDS})")
    tags = sorted({node.tag for node in flow.elements() if node.tag in CODE_TAGS})
    if tags:
        problems.append("the flow has code elements: " + ", ".join(f"<{t}>" for t in tags))
    text = flow.text()
    for name, pattern in CODE_TEXT:
        found = pattern.search(text)
        if found:
            problems.append(f"the flow has {name}: {found.group()!r}")
    return problems


def rgb_of(value):
    value = value.strip().lower()
    if value.startswith("#"):
        digits = value[1:]
        if len(digits) in (3, 4):
            digits = "".join(c * 2 for c in digits[:3])
        return tuple(int(digits[i:i + 2], 16) for i in (0, 2, 4)) if len(digits) in (6, 8) else None
    if value in NAMED:
        return rgb_of("#" + NAMED[value])
    numbers = re.findall(r"[-\d.]+%?", value)
    if value.startswith("rgb") and len(numbers) >= 3:
        return tuple(round(float(n[:-1]) * 2.55) if n.endswith("%") else round(float(n)) for n in numbers[:3])
    if value.startswith("hsl") and len(numbers) >= 3:
        h, s, l = float(numbers[0].rstrip("%")) % 360, float(numbers[1].rstrip("%")) / 100, float(numbers[2].rstrip("%")) / 100
        c = (1 - abs(2 * l - 1)) * s
        x, m = c * (1 - abs((h / 60) % 2 - 1)), l - c / 2
        r, g, b = [(c, x, 0), (x, c, 0), (0, c, x), (0, x, c), (x, 0, c), (c, 0, x)][int(h // 60) % 6]
        return tuple(round((v + m) * 255) for v in (r, g, b))
    return None


def chroma(rgb):
    """OKLCH chroma of an sRGB color (Björn Ottosson's OKLab matrices)."""
    r, g, b = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in (v / 255 for v in rgb)]
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    return math.hypot(1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
                      0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s)


def color_problem(literal, where):
    """A problem when literal is an accent, a visible hue (OKLCH chroma over 0.04), that isn't a design token.
    Neutrals and faint washes pass: the check is about accents, not about every grey matching a token."""
    text = literal.lower()
    problem = f"color {literal} ({where}) is not a Straddle design token"
    if text.startswith("oklch"):
        numbers = re.findall(r"[-\d.]+%?", text)
        if len(numbers) < 3:
            return None
        lightness = float(numbers[0][:-1]) / 100 if numbers[0].endswith("%") else float(numbers[0])
        c = float(numbers[1][:-1]) * 0.004 if numbers[1].endswith("%") else float(numbers[1])
        hue = float(numbers[2].rstrip("%deg"))
        token = any(abs(lightness - tl) < 0.002 and abs(c - tc) < 0.002 and abs(hue - th) < 0.5 for tl, tc, th in TOKEN_OKLCH)
        return None if c <= ACCENT_CHROMA or token else problem
    if re.match(r"(?:lab|lch|oklab|hwb|color)\(", text):
        return problem
    rgb = rgb_of(text)
    if rgb is None or chroma(rgb) <= ACCENT_CHROMA or "%02x%02x%02x" % rgb in TOKEN_HEX:
        return None
    return problem


COLOR = re.compile(r"#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\([^()]*\)|(?<![\w-])[a-zA-Z]+(?![\w(-])")


def color_problems(rules, document):
    sources = [(prop, value, f"{selectors.strip()} {{ {prop} }}") for selectors, decls, _ in rules for prop, value in decls]
    for node in document.elements():
        sources += [(prop, value, f"<{node.tag} style>") for prop, value in declarations(node.attrs.get("style", ""))]
        sources += [(name, node.attrs[name], f"<{node.tag} {name}>") for name in
                    ("fill", "stroke", "stop-color", "color", "flood-color", "lighting-color", "bgcolor") if node.attrs.get(name)]
    problems = []
    for prop, value, where in sources:
        if NO_COLOR_PROPS.match(prop):
            continue
        value = re.sub(r"\"[^\"]*\"|'[^']*'|url\([^)]*\)", "", value)
        for found in COLOR.finditer(value):
            literal = found.group()
            if literal[0].isalpha() and "(" not in literal and literal.lower() not in NAMED:
                continue
            problem = color_problem(literal, where)
            if problem and problem not in problems:
                problems.append(problem)
    return problems


def find_flow(document):
    named = lambda node: any(re.search(r"\b(?:flow|steps)\b", token, re.I) for token in node.tokens() if token)
    elements = list(document.elements())
    for candidates in ([n for n in elements if n.tag == "ol" and named(n)], [n for n in elements if named(n)],
                       [n for n in elements if n.tag == "ol"]):
        if candidates:
            return candidates[0]
    return None


def check(html):
    builder = Builder()
    builder.feed(html)
    builder.close()
    document = builder.root
    css = "\n".join("".join(c for c in node.children if isinstance(c, str))
                    for node in document.elements() if node.tag == "style")
    rules = css_rules(css)
    flow = find_flow(document)
    problems = []
    if flow is None:
        problems.append("no flow: no ordered list of flow steps")
        steps = []
    else:
        steps = [child for child in flow.children if isinstance(child, Node)]
        if len(steps) < 2:
            problems.append(f"the flow has {len(steps)} step(s), not one row of steps")
        else:
            problems += word_and_code_problems(flow, steps)
            problems += width_problems(flow, steps, Styles(rules))
    problems += color_problems(rules, document)
    if problems:
        return "FAIL\n" + "".join(f"- {p}\n" for p in problems)
    most = max(len([w for w in s.text().split() if re.search(r"[A-Za-z0-9]", w)]) for s in steps)
    return f"PASS {len(steps)} steps, at most {most} words each\n"


def read_view(work):
    """The view's text, opened without following a symlink and only when it's a regular file under 1 MiB."""
    directory = os.open(work, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        fd = os.open(VIEW, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=directory)
    except FileNotFoundError:
        return None, directory
    except OSError:  # a symlink (ELOOP) or anything else that can't be opened as a plain file
        return b"", directory
    with os.fdopen(fd, "rb") as handle:
        info = os.fstat(handle.fileno())
        if not (info.st_mode & 0o170000 == 0o100000) or info.st_size > MAX_BYTES:
            return b"", directory
        return handle.read(MAX_BYTES + 1), directory


def write_result(directory, text):
    staged = f".plan-visual-shape-{secrets.token_hex(8)}.tmp"
    fd = os.open(staged, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o644, dir_fd=directory)
    os.write(fd, text.encode())
    os.close(fd)
    try:
        os.replace(staged, RESULT, src_dir_fd=directory, dst_dir_fd=directory)
    except OSError:
        os.unlink(staged, dir_fd=directory)


def main(argv):
    if len(argv) == 3 and argv[1] == "--print":
        with open(argv[2], encoding="utf-8", errors="replace") as handle:
            sys.stdout.write(check(handle.read()))
        return 0
    if len(argv) != 2:
        sys.stderr.write(__doc__)
        return 2
    data, directory = read_view(argv[1])
    if data is None:
        text = f"FAIL\n- {VIEW} was not written\n"
    elif not data or len(data) > MAX_BYTES:
        text = f"FAIL\n- {VIEW} is not a regular file under 1 MiB\n"
    else:
        try:
            text = check(data.decode("utf-8", errors="replace"))
        except Exception as error:  # a malformed page is a failed check, never a crashed hook
            text = f"FAIL\n- the check could not read the page: {type(error).__name__}: {error}\n"
    write_result(directory, text)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
