export type MediaMode = "freestyle" | "template";

export type TextBind =
  | "static"
  | "profile.name"
  | "profile.roleTitle"
  | "profile.industry";

export type TextStyle = {
  fontFamily?: string;
  fontSize: number;
  fontWeight?: number;
  color: string;
  align?: "left" | "center" | "right";
  lineHeight?: number;
  highlightColor?: string;
};

export type TemplateElement =
  | {
      id: string;
      type: "text";
      x: number;
      y: number;
      w: number;
      bind: TextBind;
      value?: string;
      style: TextStyle;
    }
  | {
      id: string;
      type: "avatar";
      x: number;
      y: number;
      size: number;
      bind: "profile.avatar";
    }
  | {
      id: string;
      type: "rect";
      x: number;
      y: number;
      w: number;
      h: number;
      fill: string;
      radius?: number;
      opacity?: number;
    }
  | {
      id: string;
      type: "post_headline";
      x: number;
      y: number;
      w: number;
      style: TextStyle;
    }
  | {
      id: string;
      type: "post_subhead";
      x: number;
      y: number;
      w: number;
      style: TextStyle;
    }
  | {
      id: string;
      type: "visual_zone";
      x: number;
      y: number;
      w: number;
      h: number;
    };

export type MediaTemplateLayout = {
  version: 1;
  background: { color: string };
  elements: TemplateElement[];
};

export type ApiMediaTemplate = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  layout: MediaTemplateLayout;
  isSystem: boolean;
  isWorkspaceDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiMediaTemplatePreset = {
  id: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  layout: MediaTemplateLayout;
  isSystem: boolean;
  workspaceId: string | null;
};

export type MediaTemplatesListResponse = {
  templates: ApiMediaTemplate[];
  presets: ApiMediaTemplatePreset[];
  defaultMediaMode: MediaMode;
  defaultMediaTemplateId: string | null;
};

export type AiTemplateDraft = {
  name: string;
  description: string | null;
  width: number;
  height: number;
  layout: MediaTemplateLayout;
};

export type CreateMediaTemplateBody = {
  name: string;
  description?: string;
  width?: number;
  height?: number;
  layout: MediaTemplateLayout;
};

export type UpdateMediaTemplateBody = Partial<CreateMediaTemplateBody>;

export type PreviewMediaTemplateBody = {
  layout?: MediaTemplateLayout;
  headline?: string;
  headlineHighlight?: string;
  subhead?: string;
  profileName?: string;
  roleTitle?: string;
};

export type PreviewMediaTemplateResponse = {
  pngBase64: string;
  mimeType: string;
};
