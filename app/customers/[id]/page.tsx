import CustomerDetailEditor from "@/components/CustomerDetailEditor";

type CustomerDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CustomerDetailPage({
  params
}: CustomerDetailPageProps) {
  const { id } = await params;

  return <CustomerDetailEditor id={id} />;
}
