"use client";

import { forwardRef } from "react";

export const Input = forwardRef(function Input(
  { label, error, hint, optional, type = "text", className = "", ...props },
  ref
) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={props.id || props.name}>
          {label}
          {optional && <span className="form-label-optional">(optional)</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`form-input ${error ? "error" : ""} ${className}`}
        id={props.id || props.name}
        {...props}
      />
      {error && <div className="form-error">{error}</div>}
      {hint && !error && <div className="form-hint">{hint}</div>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, optional, className = "", ...props },
  ref
) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={props.id || props.name}>
          {label}
          {optional && <span className="form-label-optional">(optional)</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={`form-textarea ${error ? "error" : ""} ${className}`}
        id={props.id || props.name}
        {...props}
      />
      {error && <div className="form-error">{error}</div>}
      {hint && !error && <div className="form-hint">{hint}</div>}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, optional, options = [], placeholder, className = "", ...props },
  ref
) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={props.id || props.name}>
          {label}
          {optional && <span className="form-label-optional">(optional)</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`form-select ${error ? "error" : ""} ${className}`}
        id={props.id || props.name}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <div className="form-error">{error}</div>}
      {hint && !error && <div className="form-hint">{hint}</div>}
    </div>
  );
});
