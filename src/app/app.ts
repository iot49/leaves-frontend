export type FileSystemDirectoryHandle = any;
import { type EventBus, eventbus } from "./eventbus";
export { type EventBus, eventbus };

/* Routing **************************************************************/

// current location
export let location = "/";

// change location
export function go(loc) {
  location = loc;
  window.dispatchEvent(new CustomEvent('go', { 
    bubbles: true, composed: true, 
    detail: { location: loc } 
  }));
}
