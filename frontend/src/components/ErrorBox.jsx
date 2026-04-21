export default function ErrorBox({ message }) {
  return (
    <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
      {message || 'Something went wrong'}
    </div>
  );
}
