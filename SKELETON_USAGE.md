# SkeletonLoader - Usage Guide

A reusable, responsive skeleton loading component for all tables in the CRM application.

## Location

`src/components/common/Skeleton.jsx`

## Basic Usage

### Option 1: Using SkeletonLoader (Fully Customizable)

```javascript
import { SkeletonLoader } from "../../components/common/Skeleton";

// In your component:
{
  loading ? (
    <SkeletonLoader
      rows={10} // Number of skeleton rows
      columns={5} // Number of columns
      columnWidths={["40px", "1fr", "2fr", "150px", "120px"]} // Column widths (CSS grid format)
      isMultiLine={[false, false, true, false, false]} // Which columns have multi-line content
    />
  ) : (
    <Table {...tableProps} />
  );
}
```

## Option 2: Using SkeletonPresets (Pre-configured)

Much easier! Just use the preset that matches your table type:

```javascript
import { SkeletonPresets } from '../../components/common/Skeleton';

// Admin table (default): # | Name | Description | Status | Actions
{loading ? <SkeletonPresets.admin({ rows: pageSize }) /> : <Table {...tableProps} />}

// Compact table: Name | Meta | Status | Actions
{loading ? <SkeletonPresets.compact({ rows: pageSize }) /> : <Table {...tableProps} />}

// Wide table: # | Title | Description | Date | Status | Budget | Actions
{loading ? <SkeletonPresets.wide({ rows: pageSize }) /> : <Table {...tableProps} />}

// Data table: Name | Email | Phone | Company | Status | Actions
{loading ? <SkeletonPresets.dataTable({ rows: pageSize }) /> : <Table {...tableProps} />}
```

---

## Available Presets

### 1. **admin** (Permissions, Roles, Companies)

```
# | Name | Description | Status | Actions
```

- **Columns**: 5
- **Multi-line**: Column 2 (Description)
- **Usage**: `<SkeletonPresets.admin({ rows: 10 }) />`

### 2. **compact** (Quick Overview Tables)

```
Name | Meta | Status | Actions
```

- **Columns**: 4
- **Multi-line**: Column 1 (Meta)
- **Usage**: `<SkeletonPresets.compact({ rows: 8 }) />`

### 3. **wide** (Dashboard Analytics)

```
# | Title | Description | Date | Status | Budget | Actions
```

- **Columns**: 7
- **Multi-line**: Column 2 (Description)
- **Usage**: `<SkeletonPresets.wide({ rows: 12 }) />`

### 4. **dataTable** (Users, Employees, Contacts)

```
Name | Email | Phone | Company | Status | Actions
```

- **Columns**: 6
- **Multi-line**: None
- **Usage**: `<SkeletonPresets.dataTable({ rows: 10 }) />`

---

## Real Examples from the App

### Permissions.jsx

```javascript
import { SkeletonLoader } from "../../components/common/Skeleton";

{
  loading ? (
    <SkeletonLoader
      rows={pageSize}
      columns={5}
      columnWidths={["40px", "1fr", "2fr", "150px", "120px"]}
      isMultiLine={[false, false, true, false, false]}
    />
  ) : (
    <Table {...tableProps} />
  );
}
```

### Companies.jsx (hypothetical)

```javascript
import { SkeletonPresets } from '../../components/common/Skeleton';

{loading ? <SkeletonPresets.admin({ rows: pageSize }) /> : <Table {...tableProps} />}
```

---

## Custom Configuration

For custom table layouts, use `SkeletonLoader` directly:

```javascript
<SkeletonLoader
  rows={10} // How many rows to show
  columns={6} // Total columns
  columnWidths={[
    "50px", // ID column
    "1.5fr", // Name (wide)
    "2fr", // Description (wider, multi-line)
    "120px", // Date
    "100px", // Status
    "100px", // Actions
  ]}
  isMultiLine={[
    false, // ID - single line
    false, // Name - single line
    true, // Description - multi-line
    false, // Date - single line
    false, // Status - single line
    false, // Actions - single line
  ]}
/>
```

---

## Features

✅ **Responsive Design** - Adapts to column widths using CSS Grid  
✅ **Shimmer Animation** - Smooth, professional loading effect (2.5s cycle)  
✅ **Lime Green Theme** - Matches CRM's lime green color scheme  
✅ **Multi-line Support** - Shows staggered lines for description columns  
✅ **Icon Placeholders** - Action columns show 3 icon placeholders  
✅ **Compact Design** - Optimized for visual hierarchy  
✅ **Easy Integration** - Drop-in replacement, works everywhere

---

## Best Practices

1. **Use pageSize for dynamic rows**

   ```javascript
   <SkeletonLoader rows={pageSize} ... />
   ```

   This shows skeleton rows matching the actual page size.

2. **Match real table structure**

   ```javascript
   // If table is: # | Name | Meta | Status | Actions
   <SkeletonLoader
     columns={5}
     columnWidths={["40px", "1fr", "2fr", "150px", "120px"]}
   />
   ```

3. **Mark multi-line columns**

   ```javascript
   // Column 2 (Meta) has multiple lines
   isMultiLine={[false, false, true, false, false]}
   ```

4. **Use presets when possible**
   ```javascript
   // Instead of manual config:
   <SkeletonPresets.admin({ rows: pageSize }) />
   ```

---

## Animation Performance

The shimmer animation is GPU-accelerated and extremely lightweight:

- Single `@keyframes` animation
- No JavaScript calculations
- CSS Grid for layout (no Flexbox recalculations)
- Optimized for 60fps rendering

Safe to use on pages with 100+ skeleton rows!

---

## Troubleshooting

**Skeleton doesn't fill full width?**

- Check `columnWidths` - make sure you have enough `1fr` units
- Example: `['40px', '1fr', '2fr', '150px', '120px']` uses 2 flexible columns

**Multi-line content looks wrong?**

- Update `isMultiLine` array to match your columns
- Make sure `true` is set for columns with descriptions/multi-line content

**Animation is choppy?**

- Verify browser supports CSS Grid and animations
- Check for heavy JavaScript running on the page

---

## Changelog

**v1.0** (April 1, 2026)

- Initial release
- 4 presets (admin, compact, wide, dataTable)
- Full customization support
- Responsive design
- Lime green shimmer theme
