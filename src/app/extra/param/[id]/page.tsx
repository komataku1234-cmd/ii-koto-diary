type ParamPageProps = {
    params: Promise<{id: string}>
    searchParams: Promise<{key: string}>
};

export default async function ParamPage({params, searchParams}: ParamPageProps) {
    const { id } = await params;
    const { key } = await searchParams;
    return <p>No.{id}のページを表示 {key}</p>
}