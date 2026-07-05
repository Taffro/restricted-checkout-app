
import { useState, useEffect } from "react";
import {
  reactExtension,
  Banner,
  BlockStack,
  Text,
  useApi,
  useCartLines,
  useTranslate,
	Checkbox,
	useBuyerJourneyIntercept
} from "@shopify/ui-extensions-react/checkout";

// 1. Choose an extension target
export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const translate = useTranslate();
  const { extension } = useApi();
  const cartLines = useCartLines();
	const { query } = useApi();
	// null = tag lookup not yet resolved; we fail closed until we know.
	const [hasRestricted, setHasRestricted] = useState(null);
	const [confirmed, setConfirmed] = useState(false);

  console.log("Cart Lines:", cartLines);

  const productIds = cartLines.map(line => line.merchandise.product.id);
  console.log("Product IDs:", productIds);
	console.log("hasRestricted:", hasRestricted);

	useEffect(() => {

		// If no lines, nothing to restrict and we can exit out early
		if (productIds.length === 0) { setHasRestricted(false); return; }

		// Cart changed go back to "unknown" (blocked) until the fresh lookup resolves.
		setHasRestricted(null);

		// Fetch tags for each cart product by ID.
		query(
			`query ($ids: [ID!]!) {
				nodes(ids: $ids) {
					... on Product { id tags }	
				}
			}`,
			{ variables: { ids: productIds }}
		)
		.then(({ data, errors }) => {
			// True if any  product in the cart has a tag equal to "restricted"
			const restricted = data.nodes.some(
				(n) => n?.tags?.some((t) => t.trim().toLowerCase() === "restricted")
			);

			// Update state
			setHasRestricted(restricted);
			
		})
		.catch((error) => {
			// if we can't verify the cart, block rather than risk
			// letting a restricted product through.
			console.error("Restricted product tag lookup failed:", error);
			setHasRestricted(true);
		});
	}, [cartLines]);

	// Block checkout from progressing while there's a restricted product
	// in the cart that the buyer hasn't confirmed eligibility for.
	useBuyerJourneyIntercept(({ canBlockProgress }) => {
		if (!canBlockProgress) {
			return { behavior: "allow" };
		}

		// Tag lookup still in progress, reset to fail so no
		// restricted products slip through
		if (hasRestricted === null) {
			return {
				behavior: "block",
				reason: "Cart verification in progress",
				errors: [
					{
						message:
							"We're still checking your cart. Please try again in a moment.",
					},
				],
			};
		}

		return hasRestricted && !confirmed
			? {
					behavior: "block",
					reason: "Restricted product not confirmed",
					errors: [
						{
							message:
								"Please confirm you are eligible to purchase restricted products.",
						},
					],
				}
			: { behavior: "allow" };
	});

  // 3. Render a UI
	// Nothing to show unless the cart contains a restricted product.
	if (!hasRestricted) {
		return null;
	}

	return (
		<BlockStack border="dotted" padding="tight">
			<Checkbox checked={confirmed} onChange={setConfirmed}>
				I confirm I am eligable to purchase restricted products.
			</Checkbox>
		</BlockStack>
	);
}