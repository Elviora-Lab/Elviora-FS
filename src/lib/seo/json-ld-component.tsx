export function JsonLd({ data }: { data: object }) {
  // Escape </script> sequences so user-controlled values in the JSON cannot
  // break out of the application/ld+json script tag and execute JS.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
