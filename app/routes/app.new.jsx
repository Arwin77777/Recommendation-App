





import React, { useState } from 'react';
import { Page, Card, DataTable, Button, Layout, Pagination } from '@shopify/polaris';
import { Link, useLoaderData, useNavigate } from '@remix-run/react';
import { fetchProducts } from '../server/getItems';
import {
  DeleteIcon
} from '@shopify/polaris-icons';

export async function loader({ request }) {
  try {
    const response = await fetchProducts();
    console.log(response.data);
    return { products: response.data };
  }
  catch (err) {
    console.log(err);
    return err;
  }
}

const MyDataTable = ({ data }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const handleEdit = (recommendationId) => {
    navigate(`../recommendation/${recommendationId}`);
  }
  
  const headers = [
    'Title',
    'Priority',
    'Is Enabled',
    'Actions',
    'Delete'
  ];
  
  
  
  
  const handleDelete = async (recommendationId) => {
    try {
      const res = await fetch(`http://localhost:3004/recommendation?recommendationId=${recommendationId}`, {
        method: 'DELETE',
      });
      if (res.status === 200) {
        navigate('../new');
        return { success: true };
      }
    }
    catch (err) {
      console.log(err);
      return { success: false, error: err.message };
    }
  }
  
  const rows = data
  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  .map(item => [
    item.title,
    item.priority.toString(),
    item.isEnabled.toString(),
    <Button key={item.recommendationId} onClick={() => handleEdit(item.recommendationId)}>
        Edit
      </Button>,
      <Button icon={DeleteIcon} key={item.recommendationId} onClick={() => handleDelete(item.recommendationId)} tone='critical' variant='primary' />
    ]);

  return (
    <Page>
      <Card>
        <DataTable
          columnContentTypes={[
            'text',
            'numeric',
            'text',
            'text',
            'icon'
          ]}
          headings={headers} 
          rows={rows}
        />
      {totalItems > itemsPerPage && (
        <div
        style={{
          maxWidth: '150px',
          margin: 'auto',
          // border: '1px solid var(--p-color-border)'
        }}
      >
       <Pagination
            label={currentPage+" of "+totalPages}
            hasPrevious={currentPage > 1}
            onPrevious={() => setCurrentPage(currentPage - 1)}
            hasNext={currentPage < totalPages}
            onNext={() => setCurrentPage(currentPage + 1)}
            />
        </div>
        )}
      </Card>
    </Page>
  );
};

export default function ExamplePage() {
  const { products } = useLoaderData();

  const navigate = useNavigate();
  const handleNew = () => {
    navigate('../new1');
  }

  return (
    <Page
      title='Recommendations'
      secondaryActions={[
        {
          content: "Add Recommendation",
          accessibilityLabel: "Secondary action label",
          onAction: () => handleNew(),
        }
      ]}
    >
      <Layout>
        <Layout.Section>
          {products.length > 0 ?
            (
              <MyDataTable data={products} />
            ) :
            (
              <Card>
                <p>No recommendation found</p>
              </Card>
            )
          }
        </Layout.Section>
      </Layout>
    </Page>
  )
}
