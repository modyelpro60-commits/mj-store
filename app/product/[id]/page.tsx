export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white p-10">
      <h1 className="text-5xl font-black text-purple-500">
        Product #{id}
      </h1>

      <p className="mt-6 text-zinc-400">
        Product details page
      </p>

      <button className="mt-8 bg-purple-600 px-6 py-3 rounded-xl font-bold">
        Buy Now
      </button>
    </main>
  );
}