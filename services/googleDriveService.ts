
/**
 * Integração Google Drive API v3 - Fluxo de Usuário (OAuth 2.0)
 * Substitui o fluxo de Conta de Serviço para evitar erros de atob e cota.
 */

const CLIENT_ID = "763955685718-l76h8l971a815l79u560f7890f5j6j8.apps.googleusercontent.com"; // Placeholder (O ideal é usar o do seu projeto Google Cloud)
const FOLDER_ID = "1CkAMNfWNHMVYDLfovT3l4AYgXep-FzuS";

let accessToken: string | null = null;

/**
 * Solicita o token de acesso ao usuário via Popup do Google
 */
async function getAuthToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (!window.google || !window.google.accounts) {
      reject(new Error("Biblioteca do Google não carregada. Verifique sua conexão."));
      return;
    }

    // @ts-ignore
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(`Erro na autorização: ${response.error}`));
          return;
        }
        accessToken = response.access_token;
        resolve(response.access_token);
      },
    });

    client.requestAccessToken({ prompt: accessToken ? '' : 'select_account' });
  });
}

/**
 * Realiza o upload do arquivo para o Google Drive do usuário conectado
 */
export async function uploadFileToDrive(file: File): Promise<{ url: string; name: string }> {
  try {
    // Se não temos token ou ele expirou, solicita um novo
    const token = accessToken || await getAuthToken();

    const metadata = {
      name: `GUT_${Date.now()}_${file.name}`,
      parents: [FOLDER_ID],
    };

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", file);

    const uploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink";

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    // Se o token estiver expirado (401), tenta renovar uma vez
    if (response.status === 401) {
      accessToken = null;
      return uploadFileToDrive(file);
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Erro durante o upload para o Google Drive.");
    }

    return {
      name: result.name,
      url: result.webViewLink,
    };
  } catch (error: any) {
    console.error("Erro Drive Service:", error);
    // Limpa o token em caso de erro persistente para forçar novo login
    accessToken = null;
    throw error;
  }
}
