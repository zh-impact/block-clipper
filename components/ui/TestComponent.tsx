/**
 * Test component to verify WXT auto-import works
 * This component should be automatically available in all entrypoints
 */
export function TestComponent({ message = "Auto-import works!" }: { message?: string }) {
  return (
    <div className="rounded-lg bg-green-100 p-4 text-center text-green-800">
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
