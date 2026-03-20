const fs = require('fs');
const path = require('path');

const targetPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-autolinking',
  'build',
  'platforms',
  'apple.js'
);

const replacements = [
  ['public class ${className}: ModulesProvider {', 'class ${className}: ModulesProvider {'],
  [
    '  public override func getModuleClasses() -> [AnyModule.Type] {',
    '  override func getModuleClasses() -> [AnyModule.Type] {',
  ],
  [
    '  public override func getAppDelegateSubscribers() -> [ExpoAppDelegateSubscriber.Type] {',
    '  override func getAppDelegateSubscribers() -> [ExpoAppDelegateSubscriber.Type] {',
  ],
  [
    '  public override func getReactDelegateHandlers() -> [ExpoReactDelegateHandlerTupleType] {',
    '  override func getReactDelegateHandlers() -> [ExpoReactDelegateHandlerTupleType] {',
  ],
  [
    '  public override func getAppCodeSignEntitlements() -> AppCodeSignEntitlements {',
    '  override func getAppCodeSignEntitlements() -> AppCodeSignEntitlements {',
  ],
];

if (!fs.existsSync(targetPath)) {
  console.warn(`Skipping Expo autolinking patch, file not found: ${targetPath}`);
  process.exit(0);
}

const original = fs.readFileSync(targetPath, 'utf8');
let patched = original;

for (const [search, replace] of replacements) {
  patched = patched.replace(search, replace);
}

if (patched === original) {
  console.log('Expo autolinking Swift access patch already applied.');
  process.exit(0);
}

fs.writeFileSync(targetPath, patched, 'utf8');
console.log('Applied Expo autolinking Swift access patch.');
