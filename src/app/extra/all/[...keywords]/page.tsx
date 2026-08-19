type ParamAllPageProps = {
    params: Promise<{ keywords?: string[] }>
};

export default async function ParamAllPage({ params }: ParamAllPageProps) {
    const { keywords } = await params;
    return keywords ? <p>渡されたキーワード: {keywords.join()}</p> : <p>渡されたキーワード: なし</p>;
}