export interface LinkData {
  id: string;
  clientName: string;
  clientEmail?: string;
  value: number;
  date: string;
  time: string;
  status: 'Pago' | 'Pendente' | 'Cancelado' | 'Expirado';
  orderId: string;
}

export interface ChartData {
  day: string;
  value: number;
}

export interface CustomerForm {
  name: string;
  surname: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
  gender: string;
}

export interface AddressForm {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  reference: string;
}
