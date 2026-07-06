import OrderDetail from '../components/order-detail.component';

type OrderDetailPageProps = {
  id: string;
};

export default function OrderDetailPage({ id }: OrderDetailPageProps) {
  return <OrderDetail id={id} />;
}
