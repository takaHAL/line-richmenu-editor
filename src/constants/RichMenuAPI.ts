import axiosBase, { AxiosError } from "axios";
import { EditingRichMenuContextType } from "types/RichMenu";
import { v4 as uuidv4 } from "uuid";

const axios = axiosBase.create({ responseType: "json" });

const errorMessages = {
  "NEED_UPLOADING": "リッチメニューのアップロードを先にしてください",
  "MISSING_USER_ID": "ユーザーIDを指定してください",
  "MISSING_IMAGE": "メニュー画像を指定してください",
  "MISSING_ALIAS": "リッチメニューエイリアスを指定してください"
} as const;

const authHeader = (channelAccessToken: string) => ({ headers: { Authorization: `Bearer ${channelAccessToken}` } });

export type APIResponse = { label?: string, endpoint?: string, status: number, result: string, imageSrc?: string };
export type ParamsValidateResult = { isSucceeded: boolean, messages: string[] };
export type APISpecification = {
  key: string,
  label: string;
  description: string;
  endpoints: string[] | ((params?: unknown) => string[]);
  validateParams: (params?: unknown) => ParamsValidateResult
  callAPI: (channelAccessToken?: string, params?: unknown) => Promise<APIResponse[]>
}

class APIList extends Array<APISpecification> {
  constructor(initialValue: Array<APISpecification>) {
    super();
    this.push(...initialValue);
  }
  get(findKey: string): APISpecification {
    return this.find(({ key }: { key: string }) => key === findKey);
  }
}

export const apiList = new APIList([
  {
    key: "createRichMenu",
    label: "アップロード",
    description: "リッチメニューをサーバーにアップロード",
    endpoints: ["POST https://api.line.me/v2/bot/richmenu", "POST https://api-data.line.me/v2/bot/richmenu/{createdRichMenuId}/content"],
    validateParams: ({ menuImage }: EditingRichMenuContextType) => {
      if (!(menuImage && menuImage.image)) return { isSucceeded: false, messages: [errorMessages.MISSING_IMAGE] };
      return { isSucceeded: true, messages: [] };
    },
    callAPI: async (
      channelAccessToken,
      { menu, menuImage, setters: { changeRichMenuId } }: EditingRichMenuContextType
    ): Promise<APIResponse[]> => {
      const responses: APIResponse[] = [];

      const createRichMenuResponse = await axios.post("/api/v2/bot/richmenu", menu, authHeader(channelAccessToken)).catch(({ response }: AxiosError<unknown>) => response);

      responses.push({ label: "リッチメニュー作成API", endpoint: "https://api.line.me/v2/bot/richmenu", status: createRichMenuResponse.status, result: JSON.stringify(createRichMenuResponse.data) });
      if (createRichMenuResponse.data.richMenuId) {
        changeRichMenuId(createRichMenuResponse.data.richMenuId);
        const contentType = { JPEG: "image/jpeg", PNG: "image/png" }[menuImage.fileType];
        const uploadRichMenuImageResponse = await axios.post(
          `/api/v2/bot/richmenu/${createRichMenuResponse.data.richMenuId}/content`,
          menuImage.image.src,
          { headers: { ...authHeader(channelAccessToken).headers, "Content-Type": contentType }}
        ).catch(({ response }: AxiosError<unknown>) => response);
        responses.push({ label: "画像アップロードAPI", endpoint: `https://api-data.line.me/v2/bot/richmenu/${createRichMenuResponse.data.richMenuId}/content`, status: uploadRichMenuImageResponse.status, result: JSON.stringify(uploadRichMenuImageResponse.data) });
      }
      return responses;
    }
  },
  {
    key: "setRichMenuAsDefault",
    label: "デフォルトに指定",
    description: "リッチメニューを個別に指定していないすべてのユーザーに表示",
    endpoints: ({ richMenuId }: { richMenuId: string }) => richMenuId.startsWith("richmenu-") ? ["POST https://api.line.me/v2/bot/user/all/richmenu/{richMenuId}"] : [],
    validateParams: ({ richMenuId }: { richMenuId: string }) => (richMenuId.startsWith("richmenu-") ? { isSucceeded: true, messages: [] } : { isSucceeded: false, messages: [errorMessages.NEED_UPLOADING] }),
    callAPI: async (channelAccessToken, { richMenuId }: { richMenuId: string }) => {
      const responses: APIResponse[] = [];
      const setRichMenuAsDefaultResponse = await axios.post(`/api/v2/bot/user/all/richmenu/${richMenuId}`, null, authHeader(channelAccessToken)).catch(({ response }: AxiosError<unknown>) => response);
      responses.push({ label: "リッチメニュー設定API", endpoint: `https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, status: setRichMenuAsDefaultResponse.status, result: JSON.stringify(setRichMenuAsDefaultResponse.data) });
      return responses;
    }
  },
  {
    key: "addRichMenuAlias",
    label: "エイリアスを追加",
    description: "リッチメニュー切替アクションに使うエイリアスを追加",
    endpoints: ["POST https://api.line.me/v2/bot/richmenu/alias"],
    validateParams: ({ richMenuId, alias }: { richMenuId: string, alias: string }) => {
      const messages = [];
      let isSucceeded = true;
      if (!richMenuId.startsWith("richmenu-")) {
        isSucceeded = false;
        messages.push(errorMessages.NEED_UPLOADING);
      }
      if (!alias || alias.length === 0) {
        isSucceeded = false;
        messages.push(errorMessages.MISSING_ALIAS);
      }
      return { isSucceeded, messages };
    },
    callAPI: async (channelAccessToken, { richMenuId, alias }: { richMenuId: string, alias: string }) => {
      const responses: APIResponse[] = [];
      const addRichMenuAliasResponse = await axios.post(`/api/v2/bot/richmenu/alias`, { richMenuId, richMenuAliasId: alias }, authHeader(channelAccessToken)).catch(({ response }: AxiosError<unknown>) => response);
      responses.push({ label: "リッチメニューエイリアス作成API", endpoint: "https://api.line.me/v2/bot/richmenu/alias", status: addRichMenuAliasResponse.status, result: JSON.stringify(addRichMenuAliasResponse.data) });
      return responses;
    }
  },
  {
    key: "deleteRichMenuAlias",
    label: "エイリアスを削除",
    description: "リッチメニューエイリアスを削除",
    endpoints: ({ alias }: { alias: string }) => [`DELETE https://api.line.me/v2/bot/richmenu/alias/${alias}`],
    validateParams: ({ alias }: { alias: string }) => {
      const messages = [];
      let isSucceeded = true;
      if (!alias || alias.length === 0) {
        isSucceeded = false;
        messages.push(errorMessages.MISSING_ALIAS);
      }
      return { isSucceeded, messages };
    },
    callAPI: async (channelAccessToken, { alias }: { alias: string }) => {
      const responses: APIResponse[] = [];
      const deleteRichMenuAliasResponse = await axios.delete(`/api/v2/bot/richmenu/alias/${alias}`, authHeader(channelAccessToken)).catch(({ response }: AxiosError<unknown>) => response);
      responses.push({ label: "リッチメニューエイリアス削除API", endpoint: `https://api.line.me/v2/bot/richmenu/alias/${alias}`, status: deleteRichMenuAliasResponse.status, result: JSON.stringify(deleteRichMenuAliasResponse.data) });
      return responses;
    }
  },
  {
    key: "deleteRichMenu",
    label: "削除",
    description: "リッチメニューを削除する",
    endpoints: ({ richMenuId }: { richMenuId: string }) => richMenuId.startsWith("richmenu-") ? ["DELETE https://api.line.me/v2/bot/richmenu/{richMenuId}"] : [],
    validateParams: () => ({ isSucceeded: true, messages: [] }),
    callAPI: async (
      channelAccessToken,
      { richMenuId, deleteFromLocal, setters: { changeRichMenuId } }: EditingRichMenuContextType & { deleteFromLocal: boolean }
    ): Promise<APIResponse[]> => {
      const responses: APIResponse[] = [];
      if (richMenuId.startsWith("richmenu-")) {
        const deleteRichMenuResponse = await axios.delete(`/api/v2/bot/richmenu/${richMenuId}`, authHeader(channelAccessToken)).catch(({ response }: AxiosError<unknown>) => response);
        responses.push({ label: "リッチメニュー削除API", endpoint: "https://api.line.me/v2/bot/richmenu", status: deleteRichMenuResponse.status, result: JSON.stringify(deleteRichMenuResponse.data) });
      }
      changeRichMenuId((deleteFromLocal || !richMenuId.startsWith("richmenu-")) ? "DELETED" : uuidv4());
      return responses;
    }
  }
]);
