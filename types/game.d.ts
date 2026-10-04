// Globals the browser provides that the DOM typings don't know about, and the hooks the tests use.
interface Window {
  webkitAudioContext?: typeof AudioContext;
  __game?: any;
  __edit?: any;
}
