import { verifyListingUrl } from "@/lib/ats-verification";
import type { VerificationApiResponse } from "@/lib/verification-types";
import { UrlSafetyError } from "@/lib/url-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "The listing could not be verified.";
}

export async function POST(
  request: Request,
): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    const response: VerificationApiResponse = {
      ok: false,
      error: "The request did not contain valid JSON.",
    };

    return Response.json(response, {
      status: 400,
    });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("listingUrl" in body) ||
    typeof body.listingUrl !== "string"
  ) {
    const response: VerificationApiResponse = {
      ok: false,
      error: "A listing URL is required.",
    };

    return Response.json(response, {
      status: 400,
    });
  }

  const listingUrl = body.listingUrl.trim();

  if (!listingUrl) {
    const response: VerificationApiResponse = {
      ok: false,
      error: "A listing URL is required.",
    };

    return Response.json(response, {
      status: 400,
    });
  }

  if (listingUrl.length > 2_048) {
    const response: VerificationApiResponse = {
      ok: false,
      error: "The listing URL is too long.",
    };

    return Response.json(response, {
      status: 400,
    });
  }

  try {
    const result =
      await verifyListingUrl(listingUrl);

    const response: VerificationApiResponse = {
      ok: true,
      result,
    };

    return Response.json(response);
  } catch (error) {
    const response: VerificationApiResponse = {
      ok: false,
      error: errorMessage(error),
    };

    return Response.json(response, {
      status:
        error instanceof UrlSafetyError
          ? 400
          : 502,
    });
  }
}