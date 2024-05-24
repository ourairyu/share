const { existsSync } = require('fs');

const { scanAndSortByAsc, ensureDirExists, cp, readData, saveData, getLocalDataRoot } = require('../helper');
const { getCollectionRoot } = require('./helper');

const collectionName = 'bookmarks';

function generateBookmarks(sourceRootPath) {
  const BOOKMARK_ROOT = getCollectionRoot(collectionName);
  const listRoot = `${sourceRootPath}/collection/lists`;
  const data = { items: {} };

  ensureDirExists(BOOKMARK_ROOT, true);

  scanAndSortByAsc(listRoot).forEach(slug => {
    if (slug.startsWith('.')) {
      return;
    }

    const metadataDir = `${listRoot}/${slug}/.meta`;
    const { type, ...bookmark } = readData(`${metadataDir}/basic.yml`);

    if (type !== 'url') {
      return;
    }

    data.items[slug] = bookmark;

    const frontMatter = [`title: ${bookmark.title}`, `description: ${bookmark.description || ''}`];
    const ext = ['jpg', 'png'].filter(ext => existsSync(`${metadataDir}/banner.${ext}`))[0];

    if (ext) {
      const imageDir = `${BOOKMARK_ROOT}/${slug}`;

      ensureDirExists(imageDir);
      cp(`${metadataDir}/banner.*`, `${imageDir}/`);

      const imagePath = `/knosys/${collectionName}/${slug}/banner.${ext}`;

      frontMatter.push(`banner:\n  url: ${imagePath}\n  description: ${bookmark.title}`, `image: ${imagePath}`);
    }

    frontMatter.push(`permalink: /${collectionName}/${slug}/`);

    saveData(`${BOOKMARK_ROOT}/${slug}/index.md`, `---\n${frontMatter.join('\n')}\n---\n`);
  });

  saveData(`${getLocalDataRoot()}/${collectionName}.yml`, data);
}

module.exports = { generateBookmarks };
