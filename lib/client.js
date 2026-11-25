/**
 * dsh-filepath-drop — renderer client.
 *
 * 监听文件拖放，在会话输入框光标处插入文件的本地路径文本（不上传文件）。
 * DSH 的输入框是 Lexical 编辑器：<div data-composer-input contenteditable="true" role="textbox">
 */
window.__ModuleLoader__.load({
  id: "dsh-filepath-drop",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var COMPOSER_SELECTOR = "[data-composer-input], [role=\"textbox\"], [data-composer-card] textarea";

    function hostPathOf(file){
      try {
        var api = window.__DSH_HOST_PATHS__;
        if (api && typeof api.pathFor === "function") {
          var p = api.pathFor(file);
          if (typeof p === "string" && p.length > 0) return p;
        }
      } catch (e) {}
      try { if (typeof file.path === "string" && file.path.length > 0) return file.path; } catch (e) {}
      try { if (typeof file.name === "string" && file.name.length > 0) return file.name; } catch (e) {}
      return null;
    }
    function isComposer(el){
      if (!el) return false;
      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) return true;
      try {
        return !!(el.getAttribute && (el.getAttribute("contenteditable") === "true" || el.getAttribute("role") === "textbox"));
      } catch (e) { return false; }
    }
    function activeComposer(){
      var a = document.activeElement;
      if (isComposer(a)) return a;
      return document.querySelector(COMPOSER_SELECTOR);
    }
    function insertAtCursor(text){
      var el = activeComposer();
      if (!el) return false;
      try { el.focus(); } catch (e) {}
      var ok = false;
      try { ok = document.execCommand("insertText", false, text); } catch (e) {}
      if (ok) return true;
      if (!(el instanceof HTMLTextAreaElement) && !(el instanceof HTMLInputElement)) {
        try {
          var sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            var range = sel.getRangeAt(0);
            range.deleteContents();
            var node = document.createTextNode(text);
            range.insertNode(node);
            range.setStartAfter(node);
            range.setEndAfter(node);
            sel.removeAllRanges();
            sel.addRange(range);
            el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
            return true;
          }
        } catch (e) {}
        return false;
      }
      var proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      var desc = Object.getOwnPropertyDescriptor(proto, "value");
      var setter = desc && desc.set;
      if (!setter) return false;
      var s = typeof el.selectionStart === "number" ? el.selectionStart : el.value.length;
      var e2 = typeof el.selectionEnd === "number" ? el.selectionEnd : el.value.length;
      setter.call(el, el.value.slice(0, s) + text + el.value.slice(e2));
      var caret = s + text.length;
      try { el.setSelectionRange(caret, caret); } catch (e) {}
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }
    function looksLikeFileDrag(e){
      var t = e && e.dataTransfer;
      if (!t) return false;
      var types = [];
      try { types = Array.from(t.types || []); } catch (err) {}
      return types.indexOf("Files") >= 0 || types.length === 0;
    }
    var lastDrop = 0;
    function onOver(e){
      if (!looksLikeFileDrag(e)) return;
      e.preventDefault();
      if (e.dataTransfer) { try { e.dataTransfer.dropEffect = "copy"; } catch (err) {} }
    }
    function onEnter(e){ if (looksLikeFileDrag(e)) e.preventDefault(); }
    function onDrop(e){
      var now = Date.now();
      if (now - lastDrop < 300) return;
      lastDrop = now;
      if (!looksLikeFileDrag(e)) return;
      e.preventDefault();
      try {
        var dt = e.dataTransfer;
        var files = Array.from((dt && dt.files) || []);
        var paths = [];
        for (var i = 0; i < files.length; i++) {
          var p = hostPathOf(files[i]);
          if (p) paths.push(p);
        }
        if (paths.length) insertAtCursor(paths.join("\n") + " ");
      } catch (err) {}
      // 不 stopPropagation：让官方附件模块的 reset() 清除拖放遮罩；
      // 同时把 dataTransfer 换成空文件版本，阻止它真的上传文件。
      try {
        Object.defineProperty(e, "dataTransfer", {
          configurable: true,
          value: { types: ["Files"], files: [], items: [], dropEffect: "copy", effectAllowed: "copy" }
        });
      } catch (err) {}
    }
    var installed = false;
    function install(){
      if (installed) return;
      installed = true;
      document.addEventListener("dragenter", onEnter, true);
      document.addEventListener("dragover", onOver, true);
      document.addEventListener("drop", onDrop, true);
    }
    try { install(); } catch (e) {}
    function apply(_ctx){ install(); }
    exports.apply = apply;
    exports.name = "dsh-filepath-drop";
    exports.inject = ["slots"];
    return module.exports;
  }
});
