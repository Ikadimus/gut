
/**
 * Serviço para integração com Google Drive API v3
 */

// Declaração global para evitar erros de tipo com o SDK do Google Identity Services
declare global {
  interface Window {
    // Fix: Unified global declaration of google property on Window to ensure identical modifiers (making it optional to match App.tsx)
    google?: any;
  }
}

// Nota: Para produção, o CLIENT_ID deve estar em variáveis de ambiente.
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''; 
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let accessToken: string | null = null;

/**
 * Solicita autorização do usuário via Google Identity Services
 */
export const getDriveAccessToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (accessToken) {
      resolve(accessToken);
      return;
    }

    // Fix: Access google property via window and ensure it exists to satisfy TypeScript
    if (!window.google) {
      reject(new Error("Google SDK não carregado. Verifique sua conexão."));
      return;
    }

    // Fix: Use window.google for token client initialization
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.error) {
          reject(response);
          return;
        }
        accessToken = response.access_token;
        resolve(accessToken!);
      },
    });

    client.requestAccessToken();
  });
};

/**
 * Realiza o upload de um arquivo para o Google Drive
 * Retorna o link de visualização web
 */
export const uploadFileToDrive = async (file: File): Promise<{ url: string; name: string }> => {
  const token = await getDriveAccessToken();

  const metadata = {
    name: `GUT_ANEXO_${Date.now()}_${file.name}`,
    mimeType: file.type,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Erro ao fazer upload para o Google Drive");
  }

  const result = await response.json();
  
  // Opcional: Tornar o arquivo visível para qualquer pessoa com o link (depende da política da organização)
  // Por padrão o arquivo é privado ao dono do Drive.
  
  return {
    url: result.webViewLink,
    name: file.name
  };
};
