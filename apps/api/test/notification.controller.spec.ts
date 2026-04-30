import { NotificationController } from "../src/notification/notification.controller";
import { NotificationService } from "../src/notification/notification.service";

interface MockNotificationService {
  getPreference: jest.Mock;
  createPreference: jest.Mock;
  updatePreference: jest.Mock;
  deletePreference: jest.Mock;
  getNotifications: jest.Mock;
  markAsRead: jest.Mock;
  markAllAsRead: jest.Mock;
  getUnreadCount: jest.Mock;
}

describe("NotificationController", () => {
  let controller: NotificationController;
  let service: MockNotificationService;

  const reqWithUser = (id: number) => ({ user: { id } });

  beforeEach(() => {
    service = {
      getPreference: jest.fn(),
      createPreference: jest.fn(),
      updatePreference: jest.fn(),
      deletePreference: jest.fn(),
      getNotifications: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      getUnreadCount: jest.fn(),
    };

    controller = new NotificationController(
      service as unknown as NotificationService,
    );
  });

  describe("authenticated context propagation", () => {
    it("getPreference forwards req.user.id to service", () => {
      controller.getPreference(reqWithUser(42));
      expect(service.getPreference).toHaveBeenCalledWith(42);
    });

    it("createPreference uses req.user.id (not body)", () => {
      controller.createPreference(reqWithUser(7), {
        regions: ["서울 강남구"],
        priceThresholdMin: null,
        priceThresholdMax: null,
        announcementKeywords: [],
      });
      expect(service.createPreference).toHaveBeenCalledWith(7, {
        regions: ["서울 강남구"],
        priceThresholdMin: null,
        priceThresholdMax: null,
        announcementKeywords: [],
      });
    });

    it("updatePreference passes preference id, req.user.id, body to service", () => {
      controller.updatePreference(reqWithUser(7), 99, { isActive: false });
      expect(service.updatePreference).toHaveBeenCalledWith(99, 7, {
        isActive: false,
      });
    });

    it("deletePreference passes preference id and req.user.id", () => {
      controller.deletePreference(reqWithUser(7), 99);
      expect(service.deletePreference).toHaveBeenCalledWith(99, 7);
    });

    it("getNotifications forwards req.user.id with default pagination", () => {
      controller.getNotifications(reqWithUser(42));
      expect(service.getNotifications).toHaveBeenCalledWith(42, 1, 20);
    });

    it("getNotifications applies provided pagination", () => {
      controller.getNotifications(reqWithUser(42), "3", "5");
      expect(service.getNotifications).toHaveBeenCalledWith(42, 3, 5);
    });

    it("markAsRead forwards notification id and req.user.id", () => {
      controller.markAsRead(reqWithUser(42), 100);
      expect(service.markAsRead).toHaveBeenCalledWith(100, 42);
    });

    it("markAllAsRead forwards req.user.id only", () => {
      controller.markAllAsRead(reqWithUser(42));
      expect(service.markAllAsRead).toHaveBeenCalledWith(42);
    });

    it("getUnreadCount forwards req.user.id only", () => {
      controller.getUnreadCount(reqWithUser(42));
      expect(service.getUnreadCount).toHaveBeenCalledWith(42);
    });
  });
});
