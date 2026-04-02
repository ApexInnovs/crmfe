import React, { forwardRef, useState, useRef, useEffect } from "react";

// --- Icons ---
const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);
const ImageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

const Input = forwardRef(
  (
    {
      label,
      name,
      type = "text",
      value,
      onChange,
      onBlur,
      placeholder,
      error,
      touched,
      required = false,
      disabled = false,
      className = "",
      options = [], // for select / multiselect
      currency = "$", // for price
      multiple = false, // for file
      accept, // for file/image
      ...rest
    },
    ref
  ) => {
    // Determine strict Error state
    const isError = Boolean(error);
    // Usually isError is (touched && error), depending on your form logic.
    // If you want it strict to *only* show on actual error strings being passed:

    // Shared Styles
    const baseInputStyle = {
      width: "100%",
      padding: type === "price" ? "10px 10px 10px 30px" : "10px 12px",
      borderRadius: "8px",
      border: isError ? "2px solid #ef4444" : "2px solid #e5e7eb",
      outline: "none",
      fontSize: "14px",
      color: "#111827",
      backgroundColor: disabled ? "#f3f4f6" : "#ffffff",
      transition: "border-color 0.2s, box-shadow 0.2s, background-color 0.2s",
      fontFamily: "inherit",
      fontWeight: 500,
    };

    const focusStyle = isError
      ? { borderColor: "#ef4444", boxShadow: "0 0 0 4px rgba(239, 68, 68, 0.15), inset 0 0 0 1px rgba(239, 68, 68, 0.1)" }
      : { borderColor: "#84cc16", boxShadow: "0 0 0 4px rgba(132, 204, 22, 0.15), inset 0 0 0 1px rgba(132, 204, 22, 0.1)" };

    const labelStyle = {
      display: "block",
      marginBottom: "6px",
      fontSize: "13px",
      fontWeight: 600,
      color: isError ? "#ef4444" : "#1f2937",
      transition: "color 0.15s",
      letterSpacing: "0.35px",
    };

    // --- Select Component logic ---
    const SelectRenderer = () => (
      <div style={{ position: "relative" }}>
        <select
          ref={ref}
          id={name}
          name={name}
          value={value === undefined ? "" : value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={`custom-select ${className}`}
          style={{ ...baseInputStyle, appearance: "none", cursor: disabled ? "not-allowed" : "pointer" }}
          {...rest}
        >
          <option value="" disabled hidden>{placeholder || "Select an option"}</option>
          {options.map((opt, i) => (
            <option key={i} value={opt.value !== undefined ? opt.value : opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280" }}>
          <ChevronDownIcon />
        </span>
      </div>
    );

    // --- MultiSelect Component logic ---
    const MultiSelectRenderer = () => {
      const [isOpen, setIsOpen] = useState(false);
      const [searchTerm, setSearchTerm] = useState("");
      const containerRef = useRef(null);
      const safeValue = Array.isArray(value) ? value : [];

      useEffect(() => {
        const handleClickOutside = (e) => {
          if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }, []);

      const handleSelect = (optValue) => {
        if (!safeValue.includes(optValue)) {
          onChange({ target: { name, value: [...safeValue, optValue] } });
        }
        setIsOpen(false);
      };

      const handleRemove = (e, optValue) => {
        e.stopPropagation();
        onChange({ target: { name, value: safeValue.filter((v) => v !== optValue) } });
      };

      return (
        <div ref={containerRef} style={{ position: "relative" }}>
          <div
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen);
                if (!isOpen) setSearchTerm(""); // Reset search when opening
              }
            }}
            style={{
              ...baseInputStyle,
              minHeight: "42px",
              padding: "4px 30px 4px 6px",
              display: "flex", flexWrap: "wrap", gap: "6px",
              cursor: disabled ? "not-allowed" : "pointer",
              ...(isOpen ? focusStyle : {})
            }}
          >
            {safeValue.length === 0 && <span style={{ color: "#9ca3af", padding: "4px 6px" }}>{placeholder || "Select options..."}</span>}
            {safeValue.map((val) => {
              const opt = options.find((o) => (o.value !== undefined ? o.value : o) === val);
              const labelText = opt ? (opt.label || opt) : val;
              return (
                <span key={val} style={{
                  display: "flex", alignItems: "center", gap: "4px",
                  background: "#d1fae5", color: "#065f46",
                  padding: "2px 8px", borderRadius: "14px", fontSize: "13px", fontWeight: 500
                }}>
                  {labelText}
                  <button type="button" onClick={(e) => handleRemove(e, val)} style={{ background: "none", border: "none", padding: 0, color: "#059669", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <XIcon />
                  </button>
                </span>
              );
            })}
            <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7280" }}>
              <ChevronDownIcon />
            </span>
          </div>
          {isOpen && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, marginTop: "4px",
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
              maxHeight: "300px", overflowY: "auto", zIndex: 50, display: "flex", flexDirection: "column"
            }}>
              <div style={{ padding: "8px", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()} // Prevent closing dropdown
                  style={{
                    width: "100%", padding: "6px 12px", borderRadius: "6px", border: "1px solid #d1d5db",
                    fontSize: "13px", outline: "none", transition: "border-color 0.15s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#059669"}
                  onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                />
              </div>

              <div style={{ flex: 1, overflowY: "auto" }}>
                {options
                  .filter(o => {
                    const labelStr = String(o.label || o).toLowerCase();
                    const isNotSelected = !safeValue.includes(o.value !== undefined ? o.value : o);
                    return isNotSelected && labelStr.includes(searchTerm.toLowerCase());
                  })
                  .map((opt, i) => {
                    const optVal = opt.value !== undefined ? opt.value : opt;
                    return (
                      <div
                        key={i}
                        onClick={() => handleSelect(optVal)}
                        style={{ padding: "8px 12px", cursor: "pointer", fontSize: "14px", borderBottom: i < options.length - 1 ? "1px solid #f3f4f6" : "none" }}
                        onMouseEnter={(e) => e.target.style.background = "#f9fafb"}
                        onMouseLeave={(e) => e.target.style.background = "transparent"}
                      >
                        {opt.label || opt}
                      </div>
                    );
                  })}
                {options.filter(o => {
                  const labelStr = String(o.label || o).toLowerCase();
                  return (!safeValue.includes(o.value !== undefined ? o.value : o)) && labelStr.includes(searchTerm.toLowerCase());
                }).length === 0 && (
                    <div style={{ padding: "12px", color: "#6b7280", fontSize: "13px", textAlign: "center" }}>
                      {searchTerm ? "No results found" : "No options available"}
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      );
    };

    // --- File & Image Renderer ---
    const FileRenderer = () => {
      const isImg = type === "image";
      const fileInputRef = useRef(null);
      const [dragActive, setDragActive] = useState(false);
      const [previews, setPreviews] = useState([]);

      // Setup initial previews if value is string (url)
      useEffect(() => {
        if (value && typeof value === 'string') {
          setPreviews([value]);
        } else if (value && Array.isArray(value) && typeof value[0] === 'string') {
          setPreviews(value);
        } else if (value instanceof File || value instanceof FileList || (Array.isArray(value) && value[0] instanceof File)) {
          // Handle File objects to DataURL if it's an image
          if (isImg) {
            const files = value instanceof FileList ? Array.from(value) : (Array.isArray(value) ? value : [value]);
            const newPreviews = files.map(f => URL.createObjectURL(f));
            setPreviews(newPreviews);
            return () => newPreviews.forEach(url => URL.revokeObjectURL(url));
          } else {
            const files = value instanceof FileList ? Array.from(value) : (Array.isArray(value) ? value : [value]);
            setPreviews(files.map(f => f.name));
          }
        } else {
          setPreviews([]);
        }
      }, [value, isImg]);

      const handleFiles = (files) => {
        if (!files || files.length === 0) return;
        onChange({ target: { name, type: "file", files: multiple ? files : files[0], value: multiple ? Array.from(files) : files[0] } });
      };

      const onDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
      };

      const onDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFiles(e.dataTransfer.files);
        }
      };

      return (
        <div style={{ width: "100%" }}>
          <div
            onDragEnter={onDrag} onDragLeave={onDrag} onDragOver={onDrag} onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%", padding: "24px 16px",
              border: isError ? "2px dashed #ef4444" : dragActive ? "2px dashed #059669" : "2px dashed #d1d5db",
              borderRadius: "8px", background: dragActive ? "#ecfdf5" : "#f9fafb",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.2s"
            }}
          >
            <input
              ref={fileInputRef} type="file" name={name} multiple={multiple} accept={accept || (isImg ? "image/*" : undefined)}
              onChange={(e) => handleFiles(e.target.files)}
              onBlur={onBlur} disabled={disabled} style={{ display: "none" }}
            />
            {isImg ? <ImageIcon /> : <UploadIcon />}
            <span style={{ marginTop: "12px", fontSize: "14px", color: isError ? "#ef4444" : "#4b5563", fontWeight: 500 }}>
              {dragActive ? "Drop here..." : `Click or drag ${isImg ? 'image' : 'file'}s here to upload`}
            </span>
            <span style={{ marginTop: "4px", fontSize: "12px", color: "#9ca3af" }}>
              {isImg ? "PNG, JPG, WEBP up to 5MB" : "Max file size: 10MB"}
            </span>
          </div>

          {/* Previews */}
          {previews.length > 0 && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
              {previews.map((p, i) => (
                <div key={i} style={{ position: "relative", width: isImg ? 64 : '100%', height: isImg ? 64 : 'auto', borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb", background: "#fff", display: isImg ? 'block' : 'flex', padding: isImg ? 0 : '8px 12px', alignItems: "center" }}>
                  {isImg ? (
                    <img src={p} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "13px", color: "#374151" }}>📄 {p}</span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onChange({ target: { name, value: multiple ? [] : null } }) }}
                    style={{ position: isImg ? "absolute" : "static", top: 4, right: 4, background: isImg ? "rgba(0,0,0,0.5)" : "none", color: isImg ? "#fff" : "#ef4444", border: "none", borderRadius: "50%", padding: 2, cursor: "pointer", marginLeft: isImg ? 0 : 'auto', display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <XIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

    // --- Main Render Dispatcher ---
    const renderField = () => {
      switch (type) {
        case "textarea":
          return (
            <textarea
              ref={ref} id={name} name={name} value={value || ""} onChange={onChange} onBlur={onBlur}
              placeholder={placeholder} disabled={disabled} className={className} rows={4}
              style={{ ...baseInputStyle, resize: "vertical" }} {...rest}
            />
          );
        case "select":
          return <SelectRenderer />;
        case "multiselect":
        case "chips":
          return <MultiSelectRenderer />;
        case "file":
        case "image":
          return <FileRenderer />;
        case "price":
        case "currency":
          return (
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: isError ? "#ef4444" : "#6b7280", fontWeight: 500 }}>{currency}</span>
              <input
                ref={ref} id={name} name={name} type="number" step="0.01" value={value || ""} onChange={onChange} onBlur={onBlur}
                placeholder={placeholder || "0.00"} disabled={disabled} className={className} style={baseInputStyle} {...rest}
              />
            </div>
          );
        default: // text, email, password, number
          return (
            <input
              ref={ref} id={name} name={name} type={type} value={value || ""} onChange={onChange} onBlur={onBlur}
              placeholder={placeholder} disabled={disabled} className={className} style={baseInputStyle} {...rest}
            />
          );
      }
    };

    return (
      <div className={`form-group ${className}`} style={{ marginBottom: "16px", position: "relative" }}>
        {label && (
          <label htmlFor={name} style={labelStyle}>
            {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
          </label>
        )}

        {/* Render Field */}
        <div style={{ position: "relative" }}>
          <style>{`
            .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
              border-color: ${isError ? '#ef4444' : '#84cc16'} !important;
              box-shadow: ${isError ? '0 0 0 4px rgba(239, 68, 68, 0.15), inset 0 0 0 1px rgba(239, 68, 68, 0.1)' : '0 0 0 4px rgba(132, 204, 22, 0.15), inset 0 0 0 1px rgba(132, 204, 22, 0.1)'} !important;
            }
          `}</style>
          {renderField()}
        </div>

        {/* Error Message */}
        {isError && (
          <div style={{
            display: "flex", alignItems: "center", gap: "4px",
            color: "#ef4444", fontSize: "13px", marginTop: "6px", fontWeight: 500,
            animation: "fadeIn 0.2s ease"
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}
      </div>
    );
  }
);

export default Input;