let listeners = [];

export const addLogListener = (cb) => {
  listeners.push(cb);
};

export const removeLogListener = (cb) => {
  listeners = listeners.filter((l) => l !== cb);
};

export const log = (...args) => {
  const message = args
    .map((a) => (typeof a === "object" ? JSON.stringify(a) : a))
    .join(" ");

  console.log(message);

  listeners.forEach((cb) => cb(message));
};