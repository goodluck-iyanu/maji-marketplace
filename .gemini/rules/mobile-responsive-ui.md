# Mobile-Responsive UI Guidelines

When building or modifying UI components, especially dashboards and data-heavy interfaces, you MUST ensure they are responsive for mobile devices:

1. **Tables**: ALWAYS wrap `<table>` elements in a horizontally scrollable container. Never allow a table to break the page width on small screens.
   ```tsx
   <div className="overflow-x-auto">
     <table className="w-full text-left">
       {/* table content */}
     </table>
   </div>
   ```

2. **Full-height Layouts**: Use `h-[100dvh]` instead of `h-screen` for full-page layouts to prevent mobile browser URL bars from hiding the bottom of the screen.

3. **Navigation**: Ensure sidebars collapse into a hamburger menu or slide-over drawer on mobile (`md:hidden` / `hidden md:flex`), so the UI remains usable on small screens.
