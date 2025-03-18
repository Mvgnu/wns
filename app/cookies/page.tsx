import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Cookie Policy for our community platform',
};

export default function CookiesPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Cookie Policy</h1>
      
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <p className="text-lg mb-6">
          Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        
        <p className="mb-6">
          This Cookie Policy explains how we use cookies and similar technologies on our platform. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. What Are Cookies?</h2>
        <p>
          Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.
        </p>
        <p className="mt-4">
          Cookies allow a website to recognize your device and remember if you've been to the website before. Cookies can also be used to remember your preferences, analyze how you use the website, and even provide personalized content.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Types of Cookies We Use</h2>
        
        <h3 className="text-xl font-medium mt-6 mb-3">2.1 Essential Cookies</h3>
        <p>
          These cookies are necessary for the website to function properly. They enable basic functions like page navigation and access to secure areas of the website. The website cannot function properly without these cookies.
        </p>
        
        <h3 className="text-xl font-medium mt-6 mb-3">2.2 Performance Cookies</h3>
        <p>
          These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. They help us improve the way our website works.
        </p>
        
        <h3 className="text-xl font-medium mt-6 mb-3">2.3 Functionality Cookies</h3>
        <p>
          These cookies allow the website to remember choices you make (such as your username, language, or the region you are in) and provide enhanced, more personal features.
        </p>
        
        <h3 className="text-xl font-medium mt-6 mb-3">2.4 Targeting/Advertising Cookies</h3>
        <p>
          These cookies are used to deliver advertisements more relevant to you and your interests. They are also used to limit the number of times you see an advertisement as well as help measure the effectiveness of an advertising campaign.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Third-Party Cookies</h2>
        <p>
          In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the website, deliver advertisements, and so on. These cookies may include:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Analytics cookies from services like Google Analytics</li>
          <li>Social media cookies from platforms like Facebook, Twitter, and LinkedIn</li>
          <li>Advertising cookies from our advertising partners</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. How to Control Cookies</h2>
        <p>
          You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed. However, if you do this, you may have to manually adjust some preferences every time you visit a site and some services and functionalities may not work.
        </p>
        <p className="mt-4">
          Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">www.allaboutcookies.org</a>.
        </p>
        
        <h3 className="text-xl font-medium mt-6 mb-3">4.1 Browser Settings</h3>
        <p>
          You can manage cookies through your browser settings. Here's how to do it in popular browsers:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>
            <strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data
          </li>
          <li>
            <strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data
          </li>
          <li>
            <strong>Safari:</strong> Preferences → Privacy → Cookies and website data
          </li>
          <li>
            <strong>Edge:</strong> Settings → Site permissions → Cookies and site data
          </li>
        </ul>
        
        <h3 className="text-xl font-medium mt-6 mb-3">4.2 Opt-Out of Specific Third-Party Cookies</h3>
        <p>
          For cookies that track you across different websites, such as advertising cookies, you can opt out through these services:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>
            <a href="https://www.youronlinechoices.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Your Online Choices</a> (EU)
          </li>
          <li>
            <a href="https://optout.networkadvertising.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Network Advertising Initiative</a> (US)
          </li>
          <li>
            <a href="https://optout.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Digital Advertising Alliance</a> (US)
          </li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Changes to This Cookie Policy</h2>
        <p>
          We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or our business practices. Any changes will become effective when we post the revised policy on our website.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Contact Us</h2>
        <p>
          If you have any questions about our use of cookies or this Cookie Policy, please contact us.
        </p>
      </div>
    </div>
  );
} 