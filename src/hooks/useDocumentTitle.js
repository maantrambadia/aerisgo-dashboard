import { useEffect } from "react";

const useDocumentTitle = (title, addAppName = true) => {
  useEffect(() => {
    const appName = "AerisGo";

    document.title = addAppName ? `${title} | ${appName}` : title;

    return () => {
      document.title = appName;
    };
  }, [title, addAppName]);
};

export default useDocumentTitle;
