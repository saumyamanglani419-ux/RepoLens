import {
  DOC_EXTS,
  IMAGE_EXTS,
  depthOf,
  extOf,
  isSourceFile,
  isTestFile,
  isVendored,
} from './files.js';

const COMMENT_LINE = /^\s*(\/\/|#(?!include|define|!)|\/\*|\*|\*\/|--|<!--|;;|%)/;
const FALLBACK_BYTES_PER_LINE = 34;

function countLines(content) {
  let total = 0;
  let blank = 0;
  let comment = 0;
  for (const line of content.split(/\r?\n/)) {
    total++;
    if (!line.trim()) blank++;
    else if (COMMENT_LINE.test(line)) comment++;
  }
  return { total, blank, comment, code: total - blank - comment };
}

/**
 * @param {Array<{path:string,size:number}>} blobs every file in the tree
 * @param {number} dirCount
 * @param {Array<{path:string,content:string}>} samples source files whose content we fetched
 */
export function computeMetrics(blobs, dirCount, samples) {
  let totalSize = 0;
  let maxDepth = 0;
  let deepestPath = '';
  let sourceFiles = 0;
  let sourceBytes = 0;
  let testFiles = 0;
  let docFiles = 0;
  let imageFiles = 0;
  let vendoredFiles = 0;
  const byExt = new Map();
  const ownFiles = [];

  for (const b of blobs) {
    const size = b.size || 0;
    totalSize += size;
    const depth = depthOf(b.path);
    if (depth > maxDepth) {
      maxDepth = depth;
      deepestPath = b.path;
    }
    if (isVendored(b.path)) {
      vendoredFiles++;
      continue;
    }
    ownFiles.push(b);
    const ext = extOf(b.path);
    const key = ext || '(none)';
    const entry = byExt.get(key) || { ext: key, count: 0, size: 0 };
    entry.count++;
    entry.size += size;
    byExt.set(key, entry);

    if (isTestFile(b.path)) testFiles++;
    if (isSourceFile(b.path) && !['html', 'css', 'scss', 'sass', 'less'].includes(ext)) {
      sourceFiles++;
      sourceBytes += size;
    }
    if (DOC_EXTS.has(ext)) docFiles++;
    if (IMAGE_EXTS.has(ext)) imageFiles++;
  }

  // Sample-based line counting, extrapolated to the rest of the codebase.
  const sampled = { files: 0, lines: 0, code: 0, blank: 0, comment: 0, bytes: 0 };
  for (const s of samples) {
    if (!s.content || !isSourceFile(s.path)) continue;
    const c = countLines(s.content);
    sampled.files++;
    sampled.lines += c.total;
    sampled.code += c.code;
    sampled.blank += c.blank;
    sampled.comment += c.comment;
    sampled.bytes += Buffer.byteLength(s.content);
  }
  const bytesPerLine =
    sampled.lines > 200 ? Math.min(80, Math.max(18, sampled.bytes / sampled.lines)) : FALLBACK_BYTES_PER_LINE;
  const estimatedLoc = Math.round(sourceBytes / bytesPerLine);
  const commentRatio = sampled.lines ? sampled.comment / sampled.lines : null;

  const filesByExtension = [...byExt.values()].sort((a, b) => b.count - a.count).slice(0, 14);
  const largestFiles = ownFiles
    .slice()
    .sort((a, b) => (b.size || 0) - (a.size || 0))
    .slice(0, 10)
    .map((f) => ({ path: f.path, size: f.size || 0 }));
  const largeFiles = ownFiles.filter((f) => (f.size || 0) > 1024 * 1024).length;

  return {
    totalFiles: blobs.length,
    totalDirs: dirCount,
    totalSize,
    avgFileSize: blobs.length ? Math.round(totalSize / blobs.length) : 0,
    maxDepth,
    deepestPath,
    sourceFiles,
    testFiles,
    docFiles,
    imageFiles,
    vendoredFiles,
    largeFiles,
    estimatedLoc,
    testToSourceRatio: sourceFiles ? Number((testFiles / sourceFiles).toFixed(3)) : 0,
    commentRatio: commentRatio === null ? null : Number(commentRatio.toFixed(3)),
    sampled,
    filesByExtension,
    largestFiles,
  };
}
