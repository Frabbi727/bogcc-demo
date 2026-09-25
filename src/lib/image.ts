/**
 * Photo uploads.
 *
 * Complaint photos are stored in localStorage as data URLs, which has a hard
 * few-megabyte budget for the whole demo. Every picture is therefore scaled down
 * and re-encoded as JPEG before it is kept.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
/** Longest edge of the stored image, in pixels. */
export const MAX_EDGE = 800
const JPEG_QUALITY = 0.7

export interface CompressedImage {
  dataUrl: string
  width: number
  height: number
  bytes: number
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('ছবিটি পড়া যায়নি।'))
    }
    img.src = url
  })
}

/**
 * Scales the image so its longest edge is at most `MAX_EDGE` and returns a JPEG
 * data URL. Rejects anything that is not an image or is over 5 MB.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('শুধু ছবি আপলোড করা যাবে।')
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('ছবির আকার ৫ মেগাবাইটের বেশি হতে পারবে না।')
  }

  const img = await loadImage(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('ছবি প্রক্রিয়া করা যায়নি।')
  ctx.drawImage(img, 0, 0, width, height)

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  // A base64 payload is about 3/4 data; enough for showing an approximate size.
  const bytes = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75)
  return { dataUrl, width, height, bytes }
}
