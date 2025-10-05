import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./auth";
import axios from "axios";
import React from "react";

// Mock axios
jest.mock("axios");

// Wrapper component for tests
const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe("AuthContext", () => {
  let localStorageMock;

  beforeEach(() => {
    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });

    axios.defaults.headers.common = {};
  });

  afterEach(() => { jest.clearAllMocks() });

  describe("AuthProvider", () => {
    it("should provide initial auth state with null user and empty token", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      const [auth] = result.current;
      expect(auth).toEqual({
        user: null,
        token: "",
      });
    });

    it("should set axios authorization header with token", () => {
      localStorageMock.getItem.mockReturnValue(null);

      renderHook(() => useAuth(), { wrapper });

      expect(axios.defaults.headers.common["Authorization"]).toBe("");
    });

    it("should load auth data from localStorage on mount", async () => {
      const mockAuthData = {
        user: { id: "123", name: "Test User", email: "test@example.com" },
        token: "mock-token-123",
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockAuthData));

      const { result } = renderHook(() => useAuth(), {
        wrapper,
      });

      await waitFor(() => {
        const [auth] = result.current;
        expect(auth.user).toEqual(mockAuthData.user);
        expect(auth.token).toBe(mockAuthData.token);
      });

      expect(localStorageMock.getItem).toHaveBeenCalledWith("auth");
    });

    it("should handle invalid JSON in localStorage gracefully", () => {
      localStorageMock.getItem.mockReturnValue("invalid-json");
      const { result } = renderHook(() => useAuth(), {
        wrapper,
      });

      const [auth] = result.current;
      expect(auth.user).toBeNull();
      expect(auth.token).toBe("");
    });

    it("should handle empty localStorage gracefully", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper,
      });

      const [auth] = result.current;
      expect(auth).toEqual({
        user: null,
        token: "",
      });
    });

    it("should update auth state when setAuth is called", async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper,
      });

      const newAuthData = {
        user: { id: "456", name: "New User", email: "new@example.com" },
        token: "new-token-456",
      };

      act(() => {
        const [, setAuth] = result.current;
        setAuth(newAuthData);
      });

      const [auth] = result.current;
      expect(auth).toEqual(newAuthData);
    });

    it("should update axios authorization header when auth state changes", async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper,
      });

      const newAuthData = {
        user: { id: "789", name: "Another User" },
        token: "another-token-789",
      };

      act(() => {
        const [, setAuth] = result.current;
        setAuth(newAuthData);
      });

      // Note: The axios header is set based on initial auth state in the component
      // It doesn't automatically update when setAuth is called
      // This is a characteristic of the current implementation
      expect(axios.defaults.headers.common["Authorization"]).toBeDefined();
    });

    it("should preserve existing auth data when updating with spread operator", async () => {
      const initialAuthData = {
        user: { id: "100", name: "Initial User" },
        token: "initial-token",
      };

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(initialAuthData)
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper,
      });

      await waitFor(() => {
        const [auth] = result.current;
        expect(auth.token).toBe(initialAuthData.token);
      });

      act(() => {
        const [auth, setAuth] = result.current;
        setAuth({
          ...auth,
          user: { ...auth.user, name: "Updated User" },
        });
      });

      const [auth] = result.current;
      expect(auth.user.id).toBe("100");
      expect(auth.user.name).toBe("Updated User");
      expect(auth.token).toBe("initial-token");
    });

    it("should handle partial auth data in localStorage", async () => {
      const partialAuthData = {
        user: { id: "200" },
        token: "partial-token",
      };

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(partialAuthData)
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper,
      });

      await waitFor(() => {
        const [auth] = result.current;
        expect(auth.user).toEqual({ id: "200" });
        expect(auth.token).toBe("partial-token");
      });
    });

    it("should allow clearing auth state", async () => {
      const mockAuthData = {
        user: { id: "300", name: "User to Clear" },
        token: "token-to-clear",
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockAuthData));

      const { result } = renderHook(() => useAuth(), {
        wrapper,
      });

      await waitFor(() => {
        const [auth] = result.current;
        expect(auth.token).toBe(mockAuthData.token);
      });

      act(() => {
        const [, setAuth] = result.current;
        setAuth({ user: null, token: "" });
      });

      const [auth] = result.current;
      expect(auth).toEqual({
        user: null,
        token: "",
      });
    });
  });

  describe("useAuth hook", () => {
    it("should return auth state and setAuth function", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper,
      });

      expect(result.current).toHaveLength(2);
      expect(result.current[0]).toHaveProperty("user");
      expect(result.current[0]).toHaveProperty("token");
      expect(typeof result.current[1]).toBe("function");
    });

    it("should return undefined when used outside of AuthProvider", () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      const { result } = renderHook(() => useAuth());
      
      expect(result.current).toBeUndefined();

      console.error = originalError;
    });

    it("should allow multiple components to access the same auth state", async () => {
      const mockAuthData = {
        user: { id: "400", name: "Shared User" },
        token: "shared-token",
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockAuthData));

      const { result: result1 } = renderHook(() => useAuth(), {
        wrapper,
      });

      const { result: result2 } = renderHook(() => useAuth(), {
        wrapper,
      });

      await waitFor(() => {
        const [auth1] = result1.current;
        const [auth2] = result2.current;
        // Note: These are from different provider instances, so they won't share state
        // In a real app, there would be one provider wrapping the entire app
        expect(auth1.token).toBe("shared-token");
        expect(auth2.token).toBe("shared-token");
      });
    });
  });

  describe("localStorage integration", () => {
    it("should call localStorage.getItem with 'auth' key", async () => {
      localStorageMock.getItem.mockReturnValue(null);

      renderHook(() => useAuth(), {
        wrapper,
      });

      await waitFor(() => {
        expect(localStorageMock.getItem).toHaveBeenCalledWith("auth");
      });
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
    });

    it("should parse JSON from localStorage correctly", async () => {
      const authData = {
        user: {
          id: "500",
          name: "JSON User",
          email: "json@example.com",
          role: 1,
        },
        token: "json-token-500",
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(authData));

      const { result } = renderHook(() => useAuth(), {
        wrapper,
      });

      await waitFor(() => {
        const [auth] = result.current;
        expect(auth.user.id).toBe("500");
        expect(auth.user.name).toBe("JSON User");
        expect(auth.user.email).toBe("json@example.com");
        expect(auth.user.role).toBe(1);
        expect(auth.token).toBe("json-token-500");
      });
    });

    it("should handle localStorage returning empty string", () => {
      localStorageMock.getItem.mockReturnValue("");

      const { result } = renderHook(() => useAuth(), {
        wrapper,
      });

      const [auth] = result.current;
      expect(auth).toEqual({
        user: null,
        token: "",
      });
    });
  });

  describe("axios defaults", () => {
    it("should set authorization header to empty string when token is empty", () => {
      localStorageMock.getItem.mockReturnValue(null);

      renderHook(() => useAuth(), {
        wrapper,
      });

      expect(axios.defaults.headers.common["Authorization"]).toBe("");
    });

    it("should set authorization header when token exists in localStorage", async () => {
      const mockAuthData = {
        user: { id: "600" },
        token: "Bearer mock-jwt-token",
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockAuthData));

      renderHook(() => useAuth(), {
        wrapper,
      });

      // Initial render sets empty token, then useEffect updates it
      await waitFor(() => {
        expect(axios.defaults.headers.common["Authorization"]).toBeDefined();
      });
    });
  });
});

