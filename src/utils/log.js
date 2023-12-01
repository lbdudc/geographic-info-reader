const DEBUG = process.env.DEBUG;

export default function log(str) {
  if (DEBUG) {
    console.log(str);
  }
}
