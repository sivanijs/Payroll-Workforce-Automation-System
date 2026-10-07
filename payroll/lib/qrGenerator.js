import QRCode from "qrcode";

export async function generateEmployeeQrCode(employeeId) {
  return QRCode.toDataURL(String(employeeId));
}
