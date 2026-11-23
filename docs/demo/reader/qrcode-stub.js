// The reader only decodes. passport/src/qr.js imports the "qrcode" encoder for renderQrSvg,
// which the reader never calls, so the import map points that name here.
export default { create() { throw new Error('The reader does not draw QR codes.'); } };
