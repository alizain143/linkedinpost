export const TEMPLATE_SLOT_FILL_V1_USER = `Post copy:
hook: {{prior.editor.hook}}
body: {{prior.editor.body}}
cta: {{prior.editor.cta}}

Profile:
name: {{profile.name}}
roleTitle: {{profile.roleTitle}}
brandPrimary: {{profile.brandPrimary}}
brandAccent: {{profile.brandAccent}}

{{#if input.mediaCustomPrompt}}
User media direction: {{input.mediaCustomPrompt}}
{{/if}}

Fill the template content slots as JSON.`;
