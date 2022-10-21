/**
 * ---------------------------------------------
 * Duplicate of the types defined in the www-app
 * Do not adapt these types without adapting the
 * source of truth in the www-app
 * ---------------------------------------------
 */

/**
 * PlayerItem is a Partial of the Document type.
 */
export type AudioPlayerItem = {
  id: string
  meta?: {
    title: string
    path: string
    publishDate?: string
    image?: string
    audioCoverCrop?: {
      x: number
      y: number
      width: number
      height: number
    }
    coverLg?: string
    coverMd?: string
    coverSm?: string
    audioSource?: {
      mediaId: string
      kind: string
      mp3: string
      aac: string
      ogg: string
      durationMs: number
      userProgress?: {
        id: string
        secs: number
      }
    }
  }
}

export type AudioQueueItem = {
  id: string
  sequence: number
  document: AudioPlayerItem
}
