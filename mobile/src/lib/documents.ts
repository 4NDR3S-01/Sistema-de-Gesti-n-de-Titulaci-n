import * as Sharing from "expo-sharing";
import { downloadFile } from "@/lib/api";

/**
 * Descarga un PDF protegido y abre el menú del sistema para verlo, guardarlo,
 * imprimirlo o enviarlo (correo, WhatsApp, Drive…).
 */
export async function openPdf(path: string, fileName: string, title: string) {
  const uri = await downloadFile(path, fileName);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: title });
  }
}
