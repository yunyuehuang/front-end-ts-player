export function appendUint8Array(data1, data2) {
  const temp = new Uint8Array(data1.length + data2.length);
  temp.set(data1);
  temp.set(data2, data1.length);
  return temp;
}

export function hexadecimalInteger(attrName) {
  if (attrName) {
    let stringValue = attrName.slice(2);
    stringValue = (stringValue.length & 1 ? '0' : '') + stringValue;

    const value = new Uint8Array(stringValue.length / 2);
    for (let i = 0; i < stringValue.length / 2; i++) {
      value[i] = parseInt(stringValue.slice(i * 2, i * 2 + 2), 16);
    }

    return value;
  } else {
    return null;
  }
}