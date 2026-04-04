# React Hot Toast - Complete Skills Guide

## Setup

React Hot Toast is already configured in your project:

- **Installed**: `react-hot-toast`
- **Provider**: `<Toaster />` component in `App.jsx`
- **Position**: Top-right by default
- **Theme**: Lime green (#84cc16) for success, Red (#ef4444) for errors

---

## 1. Basic Toast Types

### 1.1 Success Toast

```javascript
import toast from "react-hot-toast";

toast.success("Permission created successfully!");
```

### 1.2 Error Toast

```javascript
toast.error("Failed to save permission");
```

### 1.3 Blank Toast (No Icon)

```javascript
toast("This is a notification");
```

### 1.4 Custom Toast

```javascript
toast.custom(
  <div style={{ background: "#fff", padding: "20px", borderRadius: "8px" }}>
    Custom notification with JSX
  </div>,
);
```

### 1.5 Loading Toast

```javascript
const toastId = toast.loading("Processing your request...");

// Later, update it to success or error
toast.success("Done!", { id: toastId });
// or
toast.error("Failed!", { id: toastId });
```

---

## 2. Toast Options

### Common Options

```javascript
toast.success("Message", {
  duration: 3000, // Auto-dismiss time in ms (default: 2000 for success)
  position: "top-right", // Position on screen
  id: "unique-id", // Unique identifier (prevents duplicates)
  icon: "👏", // Custom icon/emoji
  className: "custom-class", // CSS class name
  style: {
    // Inline styles
    background: "#fff",
    color: "#000",
  },
  ariaProps: {
    role: "status",
    "aria-live": "polite",
  },
});
```

### Position Options

```javascript
// Available positions:
"top-left"; // Top left corner
"top-center"; // Top center
"top-right"; // Top right (default)
"bottom-left"; // Bottom left corner
"bottom-center"; // Bottom center
"bottom-right"; // Bottom right corner
```

---

## 3. Advanced Examples

### 3.1 Update Existing Toast

```javascript
// Create a toast and save its ID
const toastId = toast.loading("Loading...");

// Later, update the same toast
setTimeout(() => {
  toast.success("All done!", { id: toastId });
}, 2000);
```

### 3.2 Prevent Duplicate Toasts

```javascript
// Same id prevents showing duplicate toasts
toast.success("Copied to clipboard!", { id: "clipboard" });

// Calling again with same ID updates the existing toast
setTimeout(() => {
  toast.success("Still copied!", { id: "clipboard" });
}, 1000);
```

### 3.3 Promise Toast

```javascript
const myPromise = new Promise((resolve, reject) => {
  setTimeout(() => resolve("Success!"), 2000);
});

toast.promise(myPromise, {
  loading: "Loading...",
  success: (data) => `Got the data: ${data}`,
  error: (err) => `Error: ${err.message}`,
});
```

### 3.4 Promise with Async Function

```javascript
toast.promise(
  async () => {
    const response = await fetch("/api/data");
    return response.json();
  },
  {
    loading: "Fetching data...",
    success: "Data loaded successfully!",
    error: "Failed to load data",
  },
);
```

### 3.5 Custom JSX with Dismiss Button

```javascript
toast((t) => (
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <span>Custom notification</span>
    <button
      onClick={() => toast.dismiss(t.id)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "18px",
      }}
    >
      ✕
    </button>
  </div>
));
```

### 3.6 Dismiss Specific Toast

```javascript
const toastId = toast.loading("Processing...");

// Later, dismiss it
toast.dismiss(toastId);
```

### 3.7 Dismiss All Toasts

```javascript
toast.dismiss();
```

### 3.8 Custom Icon Theme

```javascript
toast.success("Success!", {
  iconTheme: {
    primary: "#84cc16", // Icon color (lime green)
    secondary: "#fff", // Background color
  },
});
```

---

## 4. Real-World Use Cases in Your App

### 4.1 Form Submission (Permission Creation)

```javascript
const handleModalSubmit = async (e) => {
  e.preventDefault();

  setModalLoading(true);
  try {
    await createPermission(modalFields);
    toast.success("Permission created successfully!");
    setModalOpen(false);
    getPermissions();
  } catch (error) {
    toast.error("Failed to save permission");
  } finally {
    setModalLoading(false);
  }
};
```

### 4.2 API Call with Loading State

```javascript
const handleDelete = async (id) => {
  const toastId = toast.loading("Deleting...");

  try {
    await deletePermission(id);
    toast.success("Permission deleted!", { id: toastId });
    refreshData();
  } catch (error) {
    toast.error("Failed to delete permission", { id: toastId });
  }
};
```

### 4.3 Validation Errors

```javascript
const validateForm = (data) => {
  if (!data.name) {
    toast.error("Permission name is required");
    return false;
  }
  if (!data.meta) {
    toast.error("Description is required");
    return false;
  }
  return true;
};
```

### 4.4 Success with Custom Message

```javascript
const handleStatusChange = async (permission) => {
  try {
    await updatePermission(permission._id, {
      status: permission.status === 1 ? 0 : 1,
    });
    const newStatus = permission.status === 1 ? "Inactive" : "Active";
    toast.success(`Permission is now ${newStatus}`);
  } catch (error) {
    toast.error("Failed to update status");
  }
};
```

### 4.5 Bulk Operations

```javascript
const handleBulkDelete = async (ids) => {
  const toastId = toast.loading(`Deleting ${ids.length} items...`);

  try {
    await Promise.all(ids.map((id) => deletePermission(id)));
    toast.success(`${ids.length} permissions deleted!`, { id: toastId });
  } catch (error) {
    toast.error("Some deletions failed", { id: toastId });
  }
};
```

---

## 5. Default Duration by Type

```javascript
toast(); // 4000ms
toast.success(); // 2000ms (shorter for quick feedback)
toast.error(); // 4000ms (longer for user to read)
toast.loading(); // Infinity (never auto-dismiss)
toast.custom(); // 4000ms
```

### Override Duration

```javascript
toast.success("Quick notification", { duration: 1000 });
toast.error("Important error", { duration: 5000 });

// Persistent toast
toast("Persistent", { duration: Infinity });
```

---

## 6. Styling

### 6.1 Global Styling (in App.jsx)

```javascript
<Toaster
  toastOptions={{
    style: {
      background: "#fff",
      color: "#1f2937",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      padding: "16px",
    },
    success: {
      iconTheme: {
        primary: "#84cc16",
        secondary: "#fff",
      },
      duration: 3000,
    },
    error: {
      iconTheme: {
        primary: "#ef4444",
        secondary: "#fff",
      },
      duration: 4000,
    },
  }}
/>
```

### 6.2 Per-Toast Styling

```javascript
toast.success("Styled notification", {
  style: {
    background: "linear-gradient(135deg, #84cc16, #65a30d)",
    color: "#fff",
    fontWeight: "bold",
    borderRadius: "12px",
    padding: "20px",
  },
});
```

### 6.3 CSS Class Styling

```javascript
toast.success('Styled', { className: 'custom-toast-class' });

// In your CSS:
/* styles.css */
.custom-toast-class {
  background: linear-gradient(to right, #84cc16, #65a30d);
  color: white;
  font-weight: bold;
  border-radius: 8px;
}
```

---

## 7. Accessibility

React Hot Toast includes ARIA properties by default:

```javascript
toast("Accessible notification", {
  ariaProps: {
    role: "status",
    "aria-live": "polite", // Announces to screen readers
  },
});
```

Automatic features:

- Respects `prefers-reduced-motion` OS setting
- Keyboard accessible (ESC to dismiss)
- Proper ARIA roles and labels

---

## 8. Multiple Toaster Instances

```javascript
// In App.jsx
<Toaster toasterId="main" position="top-right" />
<Toaster toasterId="bottom" position="bottom-right" />

// Use them
toast('Main notification', { toasterId: 'main' });
toast('Bottom notification', { toasterId: 'bottom' });
```

---

## 9. Common Patterns

### 9.1 Validation Pattern

```javascript
const submitForm = (data) => {
  // Client-side validation
  if (!data.name?.trim()) {
    toast.error("Name cannot be empty");
    return;
  }

  // API call
  setLoading(true);
  createPermission(data)
    .then(() => {
      toast.success("Permission created!");
      resetForm();
    })
    .catch((err) => {
      toast.error(err.response?.data?.message || "Failed to create");
    })
    .finally(() => setLoading(false));
};
```

### 9.2 Confirmation Pattern

```javascript
const confirmAction = async () => {
  const toastId = toast.loading("Confirming...");

  try {
    await performAction();
    toast.success("Action completed!", { id: toastId });
  } catch (error) {
    toast.error("Action failed!", { id: toastId });
  }
};
```

### 9.3 Chain Operations

```javascript
const handleMultiStep = async () => {
  try {
    toast.loading("Step 1: Validating...");
    await validate();

    toast.loading("Step 2: Processing...");
    await process();

    toast.success("All steps completed!");
  } catch (error) {
    toast.error("Operation failed");
  }
};
```

---

## 10. Integration with Your Project

### In Permissions.jsx

```javascript
import toast from "react-hot-toast";

// Already configured! Just use:
toast.success("Permission created!");
toast.error("Failed to save");
```

### In Other Components

```javascript
import toast from "react-hot-toast";

// Roles.jsx
const createRole = async () => {
  try {
    await saveRole(data);
    toast.success("Role created successfully!");
  } catch (error) {
    toast.error("Failed to create role");
  }
};

// Companies.jsx
const updateCompany = async () => {
  const id = toast.loading("Updating...");
  try {
    await updateCompanyData(data);
    toast.success("Company updated!", { id });
  } catch (error) {
    toast.error("Update failed", { id });
  }
};
```

---

## 11. Best Practices

✅ **DO:**

- Use toast.success() for successful operations
- Use toast.error() with descriptive error messages
- Use loading state with ID for long operations
- Keep messages short and clear
- Use the same tone/timing for consistency

❌ **DON'T:**

- Show multiple error toasts for single operation
- Use toasts for critical errors (use modal instead)
- Make toasts too fast to read (duration < 2000ms)
- Use success toast when operation is still pending
- Overuse toasts (limit to important feedback)

---

## 12. Quick Reference

```javascript
// Success
toast.success("Done!");

// Error
toast.error("Something went wrong");

// Loading
const id = toast.loading("Processing...");
toast.success("Complete!", { id });

// Custom
toast.custom(<div>Custom content</div>);

// Promise
toast.promise(promise, { loading: "...", success: "Done!", error: "Failed!" });

// Dismiss
toast.dismiss(id); // Specific toast
toast.dismiss(); // All toasts

// Custom duration
toast.success("Quick!", { duration: 1000 });

// Custom position
toast.success("Message", { position: "bottom-right" });

// Prevent duplicates
toast.success("Copied!", { id: "clipboard" });
```

---

## Summary

React Hot Toast is fully integrated into your project and ready to use anywhere. Just import and call:

```javascript
import toast from "react-hot-toast";

// You're ready to go!
toast.success("Hello World!");
```

Refer back to this guide whenever you need to add notifications to your features!
