// Reads and validates scripts/plugin-ref/<instance id>.yaml, the policy input and subject templates
// a plugin page shows (see scripts/plugin-ref.schema.json). A plugin without a file has none.
import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import yaml from 'js-yaml';

export const PLUGIN_REF_DIR = 'scripts/plugin-ref';
export const PLUGIN_REF_SCHEMA = 'scripts/plugin-ref.schema.json';

/** Thrown when a reference file doesn't match its schema. */
export class PluginRefError extends Error {}

/** Compiles the schema; pass the result to `loadPluginRef` to validate many files. */
export function pluginRefValidator(siteDir) {
  const schema = JSON.parse(fs.readFileSync(path.join(siteDir, PLUGIN_REF_SCHEMA), 'utf8'));
  return new Ajv({allErrors: true, strict: true, strictRequired: false}).compile(schema);
}

/**
 * Parses and validates a reference file's text.
 * @param {string} text
 * @param {string} name the file's name, for the error
 * @param {ReturnType<typeof pluginRefValidator>} validate
 */
export function parsePluginRef(text, name, validate) {
  const ref = yaml.load(text, {filename: name});
  if (!validate(ref)) {
    const problems = validate.errors.map((e) => `${e.instancePath || '/'} ${e.message}`);
    throw new PluginRefError(`${name} is invalid:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  }
  return ref;
}

/** The reference of an instance, or null when it has no file. */
export function loadPluginRef(siteDir, id, validate = pluginRefValidator(siteDir)) {
  const rel = `${PLUGIN_REF_DIR}/${id}.yaml`;
  const file = path.join(siteDir, rel);
  if (!fs.existsSync(file)) return null;
  return parsePluginRef(fs.readFileSync(file, 'utf8'), rel, validate);
}
