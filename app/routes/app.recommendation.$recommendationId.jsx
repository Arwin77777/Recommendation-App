import { json } from '@remix-run/node';
import shopify from "./app/shopify.server";
import React, { useState,useEffect } from 'react';
import { useNavigate, useLoaderData, useSubmit } from '@remix-run/react';
import { Page, Card, Form, FormLayout, TextField, Button, Select } from '@shopify/polaris';
import MultiAutoCombobox from './combobox';





export async function loader({ params, request }) {
  const { recommendationId } = params;

  try {
    const { admin } = await shopify.authenticate.admin(request);

    const response = await admin.graphql(`
      {
        products(first: 10, query: "inventory_total:>0") {
          nodes {
            id
            title
          }
        }
      }
    `);
    const sp = await response.json();
    console.log("wq",sp);
    const shopifyProducts = sp.data.products.nodes.map(product => ({
      value: product.id,
      label: product.title
    }));

    const recommendationResponse = await fetch(`http://localhost:3004/recommendation?recommendationId=${recommendationId}`);
    if (!recommendationResponse.ok) {
      throw new Error(`Error fetching data: ${recommendationResponse.statusText}`);
    }
    const recommendationData = await recommendationResponse.json();

    return json({ shopifyProducts, recommendationData });
  } catch (err) {
    console.error('Error occurred:', err);
    return json({ success: false, err }, { status: 500 });
  }
}

export async function action({ request }) {
  const formData = await request.formData();
  const recommendation = JSON.parse(formData.get("recommendation"));
  
  try {
    const response = await fetch(`http://localhost:3004/recommendation`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recommendation),
    });

    if (response.status==200) {
      console.log('Updated data:', response);
      return json({ success: true, message: "Updated" });
    } else {
      return json({ success: false, message: "Failed" });
    }
  } catch (err) {
    console.error(err);
    return json({ success: false, err });
  }
}





export default function RecommendationDetails() {
  const { recommendationData, shopifyProducts } = useLoaderData();
  const [recommendation, setRecommendation] = useState(recommendationData || {});
  const submit = useSubmit();
  const navigate = useNavigate();

  useEffect(() => {
    if (recommendationData) {
      setRecommendation(recommendationData);
    }
  }, [recommendationData]);


  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("recommendation", JSON.stringify(recommendation));
    submit(formData, { replace: true, method: 'PUT' });
  };

  if (!recommendation || Object.keys(recommendation).length === 0) {
    return <div>Loading...</div>;
  }

  const handleBack = ()=>{
    navigate('../new')
  }

  return (
    <Page
    backAction={{ content: "Recommendation", url: '/app/new' }} 
      breadcrumbs={[{ content: 'Recommendations', url: '/app/new' }]}
      title={`Edit Recommendation: ${recommendation.title}`}
    >
      {/* <Card> */}
        <Form onSubmit={handleSubmit}>
          <FormLayout>
            <Card>
            <TextField
              label="Title"
              value={recommendation.title || ''}
              onChange={(value) => setRecommendation({ ...recommendation, title: value })}
            />
            <TextField
              label="Priority"
              type="number"
              value={recommendation.priority?.toString() || ''}
              onChange={(value) => setRecommendation({ ...recommendation, priority: parseInt(value) })}
            />
            </Card>
            <Card>
            <MultiAutoCombobox
              options={shopifyProducts}
              selectedOptions={recommendation.triggerProductIds}
              setSelectedOptions={(selected) => setRecommendation({ ...recommendation, triggerProductIds: selected })}
              label="Trigger Product IDs"
            />
            <MultiAutoCombobox
              options={shopifyProducts}
              selectedOptions={recommendation.recommendedProductIds}
              setSelectedOptions={(selected) => setRecommendation({ ...recommendation, recommendedProductIds: selected })}
              label="Recommended Product IDs"
            />
            </Card>
            <Card>
            <Select
              label="Is Enabled"
              options={[
                { label: 'Yes', value: 'true' },
                { label: 'No', value: 'false' }
              ]}
              value={recommendation.isEnabled?.toString() || ''}
              onChange={(value) => setRecommendation({ ...recommendation, isEnabled: value === 'true' })}
            />
            </Card>
            <Button submit>Save Changes</Button>
          </FormLayout>
        </Form>
      {/* </Card> */}
    </Page>
  );
}
