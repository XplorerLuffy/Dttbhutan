/**
 * schema.org structured data, as a JSON-LD script tag.
 *
 * The data comes partly from the database — package titles, article text,
 * FAQ answers an admin typed — and JSON.stringify alone does not make that
 * safe inside a <script>: a string containing "</script>" would close the
 * tag early and let the rest run as markup. Escaping every "<" as <
 * keeps the JSON identical to a parser and inert to the HTML one.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
