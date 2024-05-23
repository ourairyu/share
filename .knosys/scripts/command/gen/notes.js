const { dump } = require('js-yaml');

const { rm, sortByDate, ensureDirExists, readData, saveData, readMetadata, readReadMe, getSiteRoot, getLocalDataRoot, getLocalImageRoot } = require('../../helper');
const { createGenerator, cacheClassifyItems } = require('./helper');

function getNoteRoot() {
  return `${getSiteRoot()}/source/knosys/notes`;
}

function initCache(cache) {
  cache.categorized = {};
  cache.tagged = {};

  ensureDirExists(getNoteRoot());
  rm(`${getNoteRoot()}/*/*`);
}

function getItemSourceDir(sourceRootPath, metadata) {
  return `${sourceRootPath}/${metadata.source}`;
}

function resolveItemData(sourceRootPath, id, item, _, cache) {
  const sourceDir = getItemSourceDir(sourceRootPath, item);
  const content = readReadMe(sourceDir)
    .replace(/src=\"([^\"]+)\"/g, (match, srcPath) => match.replace(srcPath, `/knosys/notes/${id}/${srcPath}`))
    .replace(/!\[([^\[\]]+)?\]\(([^\(\)]+)\)/g, (match, _, srcPath) => match.replace(srcPath, `/knosys/notes/${id}/${srcPath}`));

  const note = { ...readMetadata(sourceDir), id, content };
  const sharedMetadata = readData(`${sourceDir}/.meta/shared.yml`) || {};

  if (sharedMetadata.date) {
    note.sharedAt = sharedMetadata.date;
  }

  cache.noteContent = note.content;

  cacheClassifyItems(cache, id, note);

  return note;
}

function generateMarkdown(id, item, _, cache) {
  if (!item) {
    return;
  }

  const noteDirPath = `${getNoteRoot()}/${id}`;
  const data = Object.keys(item)
    .filter(key => ['title', 'date', 'tags', 'categories'].includes(key) && item[key])
    .reduce((acc, key) => ({ ...acc, [key]: item[key] }), {});

  data.permalink = `/notes/${id}/`;

  ensureDirExists(noteDirPath);
  saveData(`${noteDirPath}/index.md`, `---\n${dump(data)}---\n\n${cache.noteContent}\n`);
}

module.exports = {
  createNotesGenerator: (sourceRootPath, sharedRootPath) => createGenerator('notes', sharedRootPath, getLocalDataRoot, getLocalImageRoot, {
    paramPath: 'id',
    metadataRequired: false,
    getItemImageSourceDir: getItemSourceDir.bind(null, sourceRootPath),
    transformItem: resolveItemData.bind(null, sourceRootPath),
    transformData: items => ({ items, sequence: sortByDate(Object.keys(items).map(key => items[key])).map(({ id }) => id) }),
    beforeRead: initCache,
    readEach: generateMarkdown,
  }),
};
