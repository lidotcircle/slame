import * as utils from './utils';
import * as gl from './global';

/** fold section */

/** TODO reconstruct code, currently that seem's ugly */

/** TODO */
const save_sym = "sub_elements";

const fold_expr = `<span class='fold-button'>
                       <i class='fas fa-angle-down show'></i>
                       <i class='fas fa-angle-right hide'></i>
                   </span>`;
const valid_tag = /[hH]([123456])/;
const hide_elem = "--hide--";
let markdown_body_children = [];
function insert_fold_button_to_h(elem: HTMLElement)
{
    const all_h: HTMLElement[] = [];
    markdown_body_children = [];
    function get_level_by_tag(tag: string) {
        let m = tag.match(valid_tag);
        if(m == null) return 7;
        return parseInt(m[1]);
    }

    let s: HTMLElement[] = [];
    for(let i=0;i<elem.children.length;i++) {
        let c = elem.children[i];
        markdown_body_children.push(c);
        let m = c.tagName.match(valid_tag);
        /** skip unnecessary elements */
        if(s.length == 0 && m == null)
            continue;
        let nl = get_level_by_tag(c.tagName);
        while(s.length > 0) {
            let ol = get_level_by_tag(s[s.length - 1].tagName);
            if(nl <= ol) s.pop();
            else break;
        }
        for(let j=0;j<s.length;j++) {
            let x = s[j];
            x[save_sym] = x[save_sym] || [];
            x[save_sym].push(c);
        }
        if(m) {
            all_h.push(c as HTMLElement);
            s.push(c as HTMLElement);
        }
    }

    function show__(elem: HTMLElement) {
        elem.classList.remove("hide");
        if (elem[save_sym] != null) {
            for(let xyz of elem[save_sym])
                xyz.classList.remove(hide_elem);
        }
    }
    function hide__(elem: HTMLElement) {
        elem.classList.add("hide");
        if (elem[save_sym] != null) {
            for(let xyz of elem[save_sym])
                xyz.classList.add(hide_elem);
        }
    }
    function uninstall() {
        for(let c of all_h) {
            show__(c);
            c[save_sym] = undefined;
            let bt = c.querySelector(".fold-button");
            if(bt != null && bt.parentElement == c)
                c.removeChild(bt);
        }
    }

    for(let button of all_h) {
        if(Array.isArray(button[save_sym]) && button[save_sym].length > 0)
            button.appendChild(utils.text2html(fold_expr));

        let x = button.querySelector(".fold-button");
        if(x == null)
            continue;

        x.addEventListener("click", function (ev) {
            let n: HTMLElement = ev.target as HTMLElement;
            while(n != null && !n.tagName.toLowerCase().match(valid_tag))
                n = n.parentElement;
            if (n != null) {
                let show = !n.classList.contains("hide");
                if(show) hide__(n);
                else     show__(n);
            }
            ev.stopPropagation();
            ev.preventDefault();
        });
    }

    return uninstall;
}

function need_update(): boolean {
    let m = document.querySelector(".markdown-body") as HTMLElement;
    if (m == null) {
        console.error("bad selector");
        return false;
    }
    if(m.children.length != markdown_body_children.length) return true;
    for(let i=0;i<markdown_body_children.length;i++) {
        if(m.children[i] != markdown_body_children[i])
            return true;
    }
    return false;
}

const ins = () => {
    let m = document.querySelector(".markdown-body") as HTMLElement;
    if (m == null) {
        console.error("bad selector");
        return;
    }
    return insert_fold_button_to_h(m);
}
let unins = null;

export function refresh() {
    unins && unins();
    unins = ins();
}

export function do_fold() {
    let m = false;
    if (m) return;
    utils.register_function_call(() => {
        if(!gl.in_post_section) return;
        refresh();

        window.setInterval(() => {
            if(need_update()) refresh();
        }, 1000);
    });
}
