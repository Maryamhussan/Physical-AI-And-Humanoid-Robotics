import React from 'react';
import Layout from '@theme-original/Layout';
import DocusaurusChatbot from '@site/src/components/Chatbot';

export default function LayoutWrapper(props) {
  return (
    <>
      <Layout {...props}>
        {props.children}
        <DocusaurusChatbot
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            width: '400px',
            maxHeight: '600px'
          }}
          initialExpanded={false}
        />
      </Layout>
    </>
  );
}