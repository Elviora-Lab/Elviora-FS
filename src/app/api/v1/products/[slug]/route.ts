import { getSession } from '@/server/auth/get-session';
import { createHandler } from '@/server/http/handler';
import { parseParams } from '@/server/http/parse';
import { apiSuccess } from '@/server/http/response';
import { productsService } from '@/server/services/products.service';
import { productSlugParams } from '@/server/validators/products.schema';

export const runtime = 'nodejs';
export const revalidate = 120;

export const GET = createHandler<{ slug: string }>(async (req, ctx) => {
  const { slug } = await parseParams(ctx, productSlugParams);
  const session = await getSession(req);
  const product = await productsService.getBySlug(slug, { userId: session?.sub ?? null });
  return apiSuccess(product);
});
