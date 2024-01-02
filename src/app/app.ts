export type FileSystemDirectoryHandle = any;
import { type EventBus, eventbus } from "./eventbus";
export { type EventBus, eventbus };

export let location = "/";

export function go(loc) {
  location = loc;
  window.dispatchEvent(new CustomEvent('go', { bubbles: true, composed: true, detail: { location: loc } }));
}

// if undefined, call getFSRoot
export let fsRoot: FileSystemDirectoryHandle;

export function getFSRoot() {
  return new Promise<FileSystemDirectoryHandle>(function(resolve, reject) {
    if (fsRoot) resolve(fsRoot);
    (window as any).showDirectoryPicker({ mode: "readwrite" }).then(
      function(value) { fsRoot = value; resolve(value); },
      function(error) { reject(error); }
    )
  });

}