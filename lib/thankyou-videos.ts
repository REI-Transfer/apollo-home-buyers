// Thank-you page videos (hand-authored; URLs verbatim from the Vercel Blob store).
// NOTE: the live blob objects are space-encoded (%20). The originally-provided
// "+"/%2B URLs 404; these %20 URLs return HTTP 200. Do not re-encode.
// Each video carries its MEASURED aspect ratio (apollo2 is 1080x1796, not 9:16).
export interface ThankYouVideo { url: string; label: string; ratio: string }

export const THANKYOU_VIDEOS: ThankYouVideo[] = [
  {
    url: "https://i6nfd310xtqsjfx5.public.blob.vercel-storage.com/Apollo%20Home%20Buyer%201.mp4",
    label: "Thank You For Filling Out The Form",
    ratio: "1080 / 1920",
  },
  {
    url: "https://i6nfd310xtqsjfx5.public.blob.vercel-storage.com/Apollo%20Home%20Buyer%202.mp4",
    label: "Who's On The Other Side?",
    ratio: "1080 / 1796",
  },
]
