import type { Service, Surcharge } from "../pricing/types";

export type Business = {
  id: string;
  slug: string;
  name: string;
  telegramChatId: string | null;
  telegramChatName: string | null;
  phone: string | null;
  address: string | null;
};

export type BusinessContacts = Pick<Business, "phone" | "address">;

export type NewBusiness = Pick<Business, "slug" | "name" | "telegramChatId"> & Partial<BusinessContacts>;

export type TelegramChat = { id: string; name: string | null };

export type NewService = Omit<Service, "id"> & { businessId: string };

export type ServiceListing = Service & { isActive: boolean };

export type ServiceDetails = Pick<Service, "name" | "rule">;

export type AddSurchargeResult = "added" | "not_found" | "limit_reached";

export interface CatalogRepository {
  findBusinessBySlug(slug: string): Promise<Business | null>;
  createBusiness(business: NewBusiness): Promise<Business>;
  setTelegramChat(businessId: string, chat: TelegramChat | null): Promise<void>;
  setContacts(businessId: string, contacts: BusinessContacts): Promise<void>;
  listActiveServices(businessId: string): Promise<Service[]>;
  findService(businessId: string, serviceId: string): Promise<Service | null>;
  createService(service: NewService): Promise<Service>;
  listAllServices(businessId: string): Promise<ServiceListing[]>;
  setServiceActive(businessId: string, serviceId: string, isActive: boolean): Promise<void>;
  // False when the service does not exist or belongs to another business.
  updateService(businessId: string, serviceId: string, details: ServiceDetails): Promise<boolean>;
  addSurcharge(businessId: string, serviceId: string, surcharge: Surcharge): Promise<AddSurchargeResult>;
  removeSurcharge(businessId: string, serviceId: string, surchargeId: string): Promise<void>;
}
